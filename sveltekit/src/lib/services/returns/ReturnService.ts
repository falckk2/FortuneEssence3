import { IReturnRepository, IOrderRepository } from '$lib/interfaces/repositories';
import { IPaymentService, IReturnService } from '$lib/interfaces/services';
import { Return, ReturnStatus, CreateReturnItemData, ReturnFilters, ApiResponse, OrderItem } from '$lib/types';

// Statuses that indicate an in-progress or completed return.
// 'rejected' and 'cancelled' are excluded so customers can re-submit.
const BLOCKING_STATUSES = new Set<ReturnStatus>(['pending', 'approved', 'received', 'refunded']);

export class ReturnService implements IReturnService {
  constructor(
    private returnRepository: IReturnRepository,
    private orderRepository: IOrderRepository,
    private paymentService: IPaymentService
  ) {}

  async createReturn(
    orderId: string,
    items: CreateReturnItemData[],
    reason: string
  ): Promise<ApiResponse<Return>> {
    try {
      // Fetch the order
      const orderResult = await this.orderRepository.findById(orderId);
      if (!orderResult.success || !orderResult.data) {
        return { success: false, error: 'Order not found' };
      }

      const order = orderResult.data;

      // Block duplicate returns for statuses that represent an in-progress or
      // completed return. A 'rejected' or 'cancelled' return does NOT block a
      // new attempt — the customer should be able to re-submit after rejection.
      const existingReturns = await this.returnRepository.findByOrderId(orderId);
      if (existingReturns.success && existingReturns.data) {
        const blocking = existingReturns.data.find(r => BLOCKING_STATUSES.has(r.status));
        if (blocking) {
          return {
            success: false,
            error: `An active return already exists for this order (ID: ${blocking.id.substring(0, 8)}, status: ${blocking.status})`,
          };
        }
      }

      // Validate order status - must be delivered or shipped
      if (!['delivered', 'shipped'].includes(order.status)) {
        return {
          success: false,
          error: 'Only delivered or shipped orders can be returned',
        };
      }

      // Validate within 14-day return window.
      // Use updatedAt as a proxy for delivery date when status is 'delivered',
      // since the Order type has no dedicated deliveredAt field. The DB trigger
      // sets updated_at on each status change, so for delivered orders this
      // approximates the delivery timestamp. Falls back to createdAt otherwise.
      const referenceDate = order.status === 'delivered'
        ? new Date(order.updatedAt)
        : new Date(order.createdAt);
      const daysSinceReference = Math.floor(
        (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceReference > 14) {
        return {
          success: false,
          error: 'Return window has expired (14 days)',
        };
      }

      // Validate items belong to order and enforce unopened policy for oils
      const orderItems = order.items || [];
      const orderItemMap = new Map(orderItems.map((oi: OrderItem) => [oi.productId, oi]));
      for (const item of items) {
        const orderItem = orderItemMap.get(item.productId);
        if (!orderItem) {
          return {
            success: false,
            error: `Product ${item.productId} not found in order`,
          };
        }

        if (item.quantity > orderItem.quantity) {
          return {
            success: false,
            error: `Cannot return more than ordered quantity for product ${item.productId}`,
          };
        }

        // Enforce unopened policy for oils
        if (item.condition && item.condition !== 'unopened') {
          const name = (orderItem.productName || '').toLowerCase();
          if (name.includes('oil') || name.includes('olja')) {
            return {
              success: false,
              error: `Oil products (${orderItem.productName}) must be returned unopened`,
            };
          }
        }
      }

      // Calculate refund amount from order items JSON.
      // Note: This is item price * quantity only. Tax (order.tax) and shipping
      // (order.shipping) are intentionally excluded per store policy — shipping
      // is non-refundable and tax adjustments are handled separately in accounting.
      let refundAmount = 0;
      for (const item of items) {
        const orderItem = orderItemMap.get(item.productId);
        if (orderItem) {
          refundAmount += orderItem.price * item.quantity;
        }
      }

      const returnData = {
        orderId,
        customerId: order.customerId,
        status: 'pending' as const,
        reason,
        refundAmount,
        refundMethod: order.paymentMethod,
      };

      return this.returnRepository.create(returnData, items);
    } catch (error) {
      return { success: false, error: `Failed to create return: ${error}` };
    }
  }

  async getReturnById(id: string): Promise<ApiResponse<Return>> {
    return this.returnRepository.findById(id);
  }

  async getAllReturns(filters?: ReturnFilters): Promise<ApiResponse<Return[]>> {
    return this.returnRepository.findAll(filters);
  }

  async approveReturn(returnId: string, adminNotes?: string): Promise<ApiResponse<Return>> {
    return this.transitionStatus(returnId, 'pending', 'approved', { adminNotes }, 'approve return');
  }

  async rejectReturn(returnId: string, reason: string): Promise<ApiResponse<Return>> {
    return this.transitionStatus(returnId, 'pending', 'rejected', { adminNotes: reason }, 'reject return');
  }

  async markReceived(returnId: string, adminNotes?: string): Promise<ApiResponse<Return>> {
    return this.transitionStatus(returnId, 'approved', 'received', { adminNotes }, 'mark return as received');
  }

  async markRefundedManually(returnId: string, adminNotes?: string): Promise<ApiResponse<Return>> {
    try {
      const existing = await this.returnRepository.findById(returnId);
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Return not found' };
      }

      if (existing.data.status !== 'received') {
        return {
          success: false,
          error: `Cannot mark as refunded with status '${existing.data.status}'. Must be 'received'.`,
        };
      }

      const refundNote = 'Manually marked as refunded (non-Stripe payment)';
      const existingNotes = existing.data.adminNotes;
      const combinedNotes = existingNotes
        ? `${existingNotes}\n${adminNotes ? adminNotes + '\n' : ''}${refundNote}`
        : `${adminNotes ? adminNotes + '\n' : ''}${refundNote}`;

      return this.returnRepository.updateStatus(returnId, 'refunded', {
        adminNotes: combinedNotes,
      });
    } catch (error) {
      return { success: false, error: `Failed to mark as refunded: ${error}` };
    }
  }

  private async transitionStatus(
    returnId: string,
    requiredStatus: ReturnStatus,
    newStatus: ReturnStatus,
    updateData: { adminNotes?: string },
    errorContext: string
  ): Promise<ApiResponse<Return>> {
    try {
      const existing = await this.returnRepository.findById(returnId);
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Return not found' };
      }

      if (existing.data.status !== requiredStatus) {
        return {
          success: false,
          error: `Cannot ${errorContext} with status '${existing.data.status}'. Must be '${requiredStatus}'.`,
        };
      }

      return this.returnRepository.updateStatus(returnId, newStatus, updateData);
    } catch (error) {
      return { success: false, error: `Failed to ${errorContext}: ${error}` };
    }
  }

  async getStatusCounts(): Promise<ApiResponse<Record<string, number>>> {
    return this.returnRepository.getStatusCounts();
  }

  async findOrphanedReturns(): Promise<ApiResponse<{ id: string; createdAt: Date }[]>> {
    return this.returnRepository.findOrphanedReturns();
  }

  async deleteOrphanedReturns(): Promise<ApiResponse<{ deleted: number }>> {
    return this.returnRepository.deleteOrphanedReturns();
  }

  async processRefund(returnId: string): Promise<ApiResponse<Return>> {
    try {
      const existing = await this.returnRepository.findById(returnId);
      if (!existing.success || !existing.data) {
        return { success: false, error: 'Return not found' };
      }

      if (existing.data.status !== 'received') {
        return {
          success: false,
          error: `Cannot process refund with status '${existing.data.status}'. Must be 'received'.`,
        };
      }

      const paymentId = existing.data.orderPaymentId;
      if (!paymentId) {
        return { success: false, error: 'No payment ID found on order' };
      }

      // Only Stripe/card payments can be refunded automatically.
      // Swish and Klarna require manual refund through their respective portals.
      const paymentMethod = existing.data.orderPaymentMethod;
      const stripeRefundable = ['stripe', 'card'];
      if (paymentMethod && !stripeRefundable.includes(paymentMethod)) {
        return {
          success: false,
          error: `Automatic refund is not supported for '${paymentMethod}' payments. Process the refund manually through the ${paymentMethod} portal, then mark as refunded.`,
        };
      }

      // Process refund via Stripe
      const refundResult = await this.paymentService.refundPayment(
        paymentId,
        existing.data.refundAmount
      );

      if (!refundResult.success) {
        return {
          success: false,
          error: `Stripe refund failed: ${refundResult.error}`,
        };
      }

      const refundNote = `Refund processed. Stripe refund ID: ${refundResult.data}`;
      const existingNotes = existing.data.adminNotes;
      const combinedNotes = existingNotes
        ? `${existingNotes}\n${refundNote}`
        : refundNote;

      return this.returnRepository.updateStatus(returnId, 'refunded', {
        adminNotes: combinedNotes,
      });
    } catch (error) {
      return { success: false, error: `Failed to process refund: ${error}` };
    }
  }
}
