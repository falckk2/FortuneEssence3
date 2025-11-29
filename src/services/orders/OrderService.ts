import { injectable, inject } from 'tsyringe';
import {
  IOrderService,
  ICartService,
  IPaymentService,
  IShippingService,
  IInventoryService,
  CreateOrderData
} from '@/interfaces/services';
import { IOrderRepository } from '@/interfaces/repositories';
import { Order, ApiResponse, CartItem } from '@/types';
import { TOKENS } from '@/config/di-container';

@injectable()
export class OrderService implements IOrderService {
  constructor(
    @inject(TOKENS.IOrderRepository) private readonly orderRepository: IOrderRepository,
    @inject(TOKENS.ICartService) private readonly cartService: ICartService,
    @inject(TOKENS.IPaymentService) private readonly paymentService: IPaymentService,
    @inject(TOKENS.IShippingService) private readonly shippingService: IShippingService,
    @inject(TOKENS.IInventoryService) private readonly inventoryService: IInventoryService
  ) {}

  async createOrder(orderData: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      // Validate cart items and check stock
      const stockValidation = await this.validateOrderStock(orderData.items);
      if (!stockValidation.success) {
        return stockValidation as ApiResponse<Order>;
      }

      // Calculate totals
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.25; // 25% Swedish VAT
      
      // Get shipping cost
      const shippingResult = await this.shippingService.calculateShipping(orderData.items, orderData.shippingAddress.country);
      if (!shippingResult.success) {
        return {
          success: false,
          error: `Shipping calculation failed: ${shippingResult.error}`,
        };
      }

      const shippingCost = shippingResult.data!.price;
      const totalAmount = subtotal + tax + shippingCost;

      // Process payment
      const paymentResult = await this.paymentService.processPayment({
        amount: totalAmount,
        currency: 'SEK',
        method: orderData.paymentMethod,
        orderId: `temp_${Date.now()}`,
        customerId: orderData.customerId,
        metadata: {
          shippingAddress: JSON.stringify(orderData.shippingAddress),
          billingAddress: JSON.stringify(orderData.billingAddress),
        },
      });

      if (!paymentResult.success) {
        return {
          success: false,
          error: `Payment processing failed: ${paymentResult.error}`,
        };
      }

      // Reserve stock
      const stockReservation = await this.inventoryService.reserveStock(orderData.items);
      if (!stockReservation.success) {
        return {
          success: false,
          error: `Stock reservation failed: ${stockReservation.error}`,
        };
      }

      // Create order
      const order = await this.orderRepository.create({
        customerId: orderData.customerId,
        items: orderData.items,
        total: totalAmount,
        tax,
        shipping: shippingCost,
        status: paymentResult.data!.status === 'success' ? 'confirmed' : 'pending',
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: orderData.paymentMethod,
        paymentId: paymentResult.data!.paymentId,
        trackingNumber: null,
      });

      if (!order.success) {
        // Release stock reservation if order creation fails
        await this.inventoryService.releaseReservation(stockReservation.data!);
        return order;
      }

      // Create shipment if payment was successful
      if (paymentResult.data!.status === 'success') {
        await this.createShipment(order.data!.id, orderData.shippingRateId);
      }

      // Clear cart after successful order
      const cartResult = await this.cartService.getCart(orderData.customerId);
      if (cartResult.success) {
        await this.cartService.clearCart(cartResult.data!.id);
      }

      return order;

    } catch (error) {
      return {
        success: false,
        error: `Failed to create order: ${error}`,
      };
    }
  }

  async getOrder(id: string): Promise<ApiResponse<Order>> {
    try {
      return await this.orderRepository.findById(id);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get order: ${error}`,
      };
    }
  }

  async getUserOrders(userId: string): Promise<ApiResponse<Order[]>> {
    try {
      return await this.orderRepository.findByCustomerId(userId);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user orders: ${error}`,
      };
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<Order>> {
    try {
      const result = await this.orderRepository.updateStatus(orderId, status as any);
      
      if (!result.success) {
        return result;
      }

      // Handle status-specific actions
      switch (status) {
        case 'confirmed':
          // Create shipment if not exists
          const order = result.data!;
          if (!order.trackingNumber) {
            await this.createShipmentForOrder(order);
          }
          break;
        
        case 'shipped':
          // Send notification email (would be implemented)
          break;
        
        case 'delivered':
          // Update inventory and release any reservations
          await this.finalizeOrderInventory(orderId);
          break;
        
        case 'cancelled':
          // Refund payment and release stock
          await this.handleOrderCancellation(orderId);
          break;
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: `Failed to update order status: ${error}`,
      };
    }
  }

  async cancelOrder(orderId: string): Promise<ApiResponse<Order>> {
    try {
      const orderResult = await this.orderRepository.findById(orderId);
      if (!orderResult.success) {
        return orderResult;
      }

      const order = orderResult.data!;

      // Check if order can be cancelled
      if (['delivered', 'shipped'].includes(order.status)) {
        return {
          success: false,
          error: 'Order cannot be cancelled after shipping',
        };
      }

      // Cancel order
      const result = await this.orderRepository.updateStatus(orderId, 'cancelled');
      
      if (result.success) {
        await this.handleOrderCancellation(orderId);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        error: `Failed to cancel order: ${error}`,
      };
    }
  }

  // Additional utility methods
  async getOrdersByStatus(status: string): Promise<ApiResponse<Order[]>> {
    try {
      return await this.orderRepository.findByStatus(status);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get orders by status: ${error}`,
      };
    }
  }

  async getOrderStatistics(customerId?: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }>> {
    try {
      return await this.orderRepository.getOrderStatistics(customerId);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get order statistics: ${error}`,
      };
    }
  }

  async trackOrder(trackingNumber: string): Promise<ApiResponse<{
    order: Order;
    tracking: any;
  }>> {
    try {
      // Get order by tracking number
      const orderResult = await this.orderRepository.findByTrackingNumber(trackingNumber);
      if (!orderResult.success) {
        return {
          success: false,
          error: orderResult.error,
        };
      }

      // Get tracking information
      const trackingResult = await this.shippingService.trackShipment(trackingNumber);
      if (!trackingResult.success) {
        return {
          success: false,
          error: trackingResult.error,
        };
      }

      return {
        success: true,
        data: {
          order: orderResult.data!,
          tracking: trackingResult.data,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to track order: ${error}`,
      };
    }
  }

  async getRecentOrders(days: number = 30, limit: number = 50): Promise<ApiResponse<Order[]>> {
    try {
      return await this.orderRepository.getRecentOrders(days, limit);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get recent orders: ${error}`,
      };
    }
  }

  // Private helper methods
  private async validateOrderStock(items: CartItem[]): Promise<ApiResponse<boolean>> {
    try {
      for (const item of items) {
        const availability = await this.inventoryService.checkAvailability(item.productId, item.quantity);
        if (!availability.success || !availability.data) {
          return {
            success: false,
            error: `Product ${item.name} is not available in requested quantity`,
          };
        }
      }

      return {
        success: true,
        data: true,
      };

    } catch (error) {
      return {
        success: false,
        error: `Stock validation failed: ${error}`,
      };
    }
  }

  private async createShipment(orderId: string, shippingRateId: string): Promise<void> {
    try {
      const shipmentResult = await this.shippingService.createShipment(orderId, shippingRateId);
      
      if (shipmentResult.success) {
        const shipment = shipmentResult.data!;
        await this.orderRepository.updateStatus(orderId, 'shipped', shipment.trackingNumber);
      }

    } catch (error) {
      console.error('Failed to create shipment:', error);
    }
  }

  private async createShipmentForOrder(order: Order): Promise<void> {
    try {
      // Use default shipping rate for the country
      const shippingRates = await this.shippingService.getShippingRates(
        order.shippingAddress.country,
        this.calculateOrderWeight(order.items)
      );

      if (shippingRates.success && shippingRates.data!.length > 0) {
        const defaultRate = shippingRates.data![0];
        await this.createShipment(order.id, defaultRate.id);
      }

    } catch (error) {
      console.error('Failed to create shipment for order:', error);
    }
  }

  private calculateOrderWeight(items: CartItem[]): number {
    // Simplified weight calculation - would use actual product weights
    return items.reduce((total, item) => total + (item.quantity * 0.5), 0); // 0.5kg per item
  }

  private async handleOrderCancellation(orderId: string): Promise<void> {
    try {
      const orderResult = await this.orderRepository.findById(orderId);
      if (!orderResult.success) return;

      const order = orderResult.data!;

      // Release stock reservations
      if (order.items) {
        await this.inventoryService.releaseReservation(orderId);
      }

      // Process refund (would be implemented with payment providers)
      if (order.paymentId) {
        console.log(`Refund needed for payment ${order.paymentId}`);
      }

    } catch (error) {
      console.error('Failed to handle order cancellation:', error);
    }
  }

  private async finalizeOrderInventory(orderId: string): Promise<void> {
    try {
      const orderResult = await this.orderRepository.findById(orderId);
      if (!orderResult.success) return;

      const order = orderResult.data!;

      // Update actual stock levels
      for (const item of order.items) {
        await this.inventoryService.updateStock(item.productId, -item.quantity);
      }

    } catch (error) {
      console.error('Failed to finalize order inventory:', error);
    }
  }
}