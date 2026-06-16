import { injectable, inject } from 'tsyringe';
import crypto from 'crypto';
import type {
  IOrderService,
  ICartService,
  IPaymentService,
  IShippingRateService,
  IShipmentTrackingService,
  IInventoryService,
  IOrderRepository,
  IOrderItemRepository,
  IProductRepository
} from '@/interfaces';
import { CreateOrderData } from '@/interfaces';
import { TrackingInfo } from '@/interfaces/shipping';
import { Order, OrderStatus, ApiResponse, CartItem, OrderItem } from '@/types';
import { TOKENS } from '@/config/di-container';

@injectable()
export class OrderService implements IOrderService {
  private static readonly PRICE_TOLERANCE = 0.01;

  constructor(
    @inject(TOKENS.IOrderRepository) private readonly orderRepository: IOrderRepository,
    @inject(TOKENS.IOrderItemRepository) private readonly orderItemRepository: IOrderItemRepository,
    @inject(TOKENS.ICartService) private readonly cartService: ICartService,
    @inject(TOKENS.IPaymentService) private readonly paymentService: IPaymentService,
    @inject(TOKENS.IShippingService) private readonly shippingService: IShippingRateService & IShipmentTrackingService,
    @inject(TOKENS.IInventoryService) private readonly inventoryService: IInventoryService,
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository
  ) {}

  async createOrder(orderData: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      const priceResolution = await this.resolveCatalogPrices(orderData.items);
      if (!priceResolution.success) {
        return { success: false, error: priceResolution.error };
      }
      const items = priceResolution.data!;

      // Validate cart items and check stock
      const stockValidation = await this.validateOrderStock(items);
      if (!stockValidation.success) {
        return { success: false, error: stockValidation.error };
      }

      // Calculate totals from server-side catalog prices
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.25; // 25% Swedish VAT

      // Get shipping cost
      const shippingResult = await this.shippingService.calculateShipping(items, orderData.shippingAddress.country);
      if (!shippingResult.success) {
        return {
          success: false,
          error: `Shipping calculation failed: ${shippingResult.error}`,
        };
      }

      const shippingCost = shippingResult.data!.price;
      const totalAmount = subtotal + tax + shippingCost;

      // Reserve stock before charging — prevents charging a customer for unavailable stock
      const stockReservation = await this.inventoryService.reserveStock(items);
      if (!stockReservation.success) {
        return {
          success: false,
          error: `Stock reservation failed: ${stockReservation.error}`,
        };
      }

      // Stable pre-order reference: a real UUID so the payment provider has a traceable reference
      // even if order DB creation fails after payment succeeds.
      const preOrderRef = crypto.randomUUID();

      // Process payment
      const paymentResult = await this.paymentService.processPayment({
        amount: totalAmount,
        currency: 'SEK',
        method: orderData.paymentMethod,
        orderId: preOrderRef,
        customerId: orderData.customerId,
        metadata: {
          shippingAddress: JSON.stringify(orderData.shippingAddress),
          billingAddress: JSON.stringify(orderData.billingAddress),
        },
      });

      if (!paymentResult.success) {
        await this.inventoryService.releaseReservation(stockReservation.data!);
        return {
          success: false,
          error: `Payment processing failed: ${paymentResult.error}`,
        };
      }

      // Transform CartItems to OrderItems
      const orderItemsResult = await this.transformCartItemsToOrderItems(items);
      if (!orderItemsResult.success) {
        await this.inventoryService.releaseReservation(stockReservation.data!);
        await this.paymentService.refundPayment(paymentResult.data!.paymentId);
        return {
          success: false,
          error: `Failed to prepare order items: ${orderItemsResult.error}`,
        };
      }

      // Create order
      const order = await this.orderRepository.create({
        customerId: orderData.customerId,
        items: orderItemsResult.data!,
        total: totalAmount,
        tax,
        shipping: shippingCost,
        status: paymentResult.data!.status === 'success' ? 'confirmed' : 'pending',
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: orderData.paymentMethod,
        paymentId: paymentResult.data!.paymentId,
        trackingNumber: undefined,
        reservationId: stockReservation.data!,
      });

      if (!order.success) {
        await this.inventoryService.releaseReservation(stockReservation.data!);
        await this.paymentService.refundPayment(paymentResult.data!.paymentId);
        return order;
      }

      // Write normalized order items for analytics (best-effort, non-blocking)
      try {
        await this.orderItemRepository.createMany(order.data!.id, orderItemsResult.data!);
      } catch (err) {
        console.error('Failed to write order_items (non-critical):', err);
      }

      // Mark reservation as completed (order finalized)
      await this.inventoryService.completeReservation(stockReservation.data!);

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

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return this.getOrder(id);
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

  async updateOrderStatus(orderId: string, status: OrderStatus, trackingNumber?: string): Promise<ApiResponse<Order>> {
    try {
      const result = await this.orderRepository.updateStatus(orderId, status, trackingNumber);

      if (!result.success) {
        return result;
      }

      const order = result.data!;

      // Handle status-specific actions
      switch (status) {
        case 'confirmed':
          if (!order.trackingNumber) {
            await this.createShipmentForOrder(order);
          }
          break;

        case 'shipped':
          // Send notification email (would be implemented)
          break;

        case 'delivered':
          // Stock was already decremented by completeReservation at order creation — no further action needed.
          break;

        case 'cancelled':
          await this.handleOrderCancellation(order);
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
      if (['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(order.status)) {
        return {
          success: false,
          error: 'Order cannot be cancelled after shipping',
        };
      }

      return this.updateOrderStatus(orderId, 'cancelled');

    } catch (error) {
      return {
        success: false,
        error: `Failed to cancel order: ${error}`,
      };
    }
  }

  // Additional utility methods
  async getOrdersByStatus(status: OrderStatus): Promise<ApiResponse<Order[]>> {
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
    tracking: TrackingInfo;
  }>> {
    try {
      const [orderResult, trackingResult] = await Promise.all([
        this.orderRepository.findByTrackingNumber(trackingNumber),
        this.shippingService.trackShipment(trackingNumber),
      ]);

      if (!orderResult.success) {
        return { success: false, error: orderResult.error };
      }
      if (!trackingResult.success) {
        return { success: false, error: trackingResult.error };
      }

      return {
        success: true,
        data: {
          order: orderResult.data!,
          tracking: trackingResult.data!,
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

  /**
   * Transforms CartItems to OrderItems by enriching them with product information.
   */
  private async transformCartItemsToOrderItems(cartItems: CartItem[]): Promise<ApiResponse<OrderItem[]>> {
    try {
      const productIds = [...new Set(cartItems.map(item => item.productId))];
      const productsResult = await this.productRepository.findByIds(productIds);
      const productMap = new Map((productsResult.data ?? []).map(p => [p.id, p]));

      const orderItems: OrderItem[] = [];

      for (const cartItem of cartItems) {
        const product = productMap.get(cartItem.productId);

        if (!product) {
          return {
            success: false,
            error: `Product with ID ${cartItem.productId} not found`,
          };
        }

        orderItems.push({
          productId: cartItem.productId,
          productName: product.name,
          quantity: cartItem.quantity,
          price: product.price,
          total: product.price * cartItem.quantity,
        });
      }

      return { success: true, data: orderItems };

    } catch (error) {
      return {
        success: false,
        error: `Failed to transform cart items: ${error}`,
      };
    }
  }

  private async resolveCatalogPrices(items: CartItem[]): Promise<ApiResponse<CartItem[]>> {
    try {
      const productIds = [...new Set(items.map(item => item.productId))];
      const productsResult = await this.productRepository.findByIds(productIds);
      const productMap = new Map((productsResult.data ?? []).map(p => [p.id, p]));

      const resolved: CartItem[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          return {
            success: false,
            error: `Product with ID ${item.productId} not found`,
          };
        }

        if (
          item.price !== undefined &&
          Math.abs(item.price - product.price) > OrderService.PRICE_TOLERANCE
        ) {
          console.warn('[DEBUG-ISSUE-042] Client price differs from catalog price', {
            productId: item.productId,
            clientPrice: item.price,
            catalogPrice: product.price,
          });
          return {
            success: false,
            error: `Price mismatch for product ${item.productId}`,
          };
        }

        resolved.push({ ...item, price: product.price });
      }

      return { success: true, data: resolved };
    } catch (error) {
      return {
        success: false,
        error: `Failed to resolve catalog prices: ${error}`,
      };
    }
  }

  private async validateOrderStock(items: CartItem[]): Promise<ApiResponse<boolean>> {
    try {
      const results = await Promise.all(
        items.map(item => this.inventoryService.checkAvailability(item.productId, item.quantity))
      );

      const failed = results.find(r => !r.success || !r.data);
      if (failed) {
        return {
          success: false,
          error: failed.error ?? 'Product is not available in requested quantity',
        };
      }

      return { success: true, data: true };

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
        await this.updateOrderStatus(orderId, 'shipped', shipment.trackingNumber);
      }

    } catch (error) {
      console.error('Failed to create shipment:', error);
    }
  }

  private async createShipmentForOrder(order: Order): Promise<void> {
    try {
      const totalWeight = await this.calculateOrderWeight(order.items);
      const shippingRates = await this.shippingService.getShippingRates(
        order.shippingAddress.country,
        totalWeight
      );

      if (shippingRates.success && shippingRates.data!.length > 0) {
        const defaultRate = shippingRates.data![0];
        await this.createShipment(order.id, defaultRate.id);
      }

    } catch (error) {
      console.error('Failed to create shipment for order:', error);
    }
  }

  private async calculateOrderWeight(items: OrderItem[]): Promise<number> {
    try {
      const productIds = [...new Set(items.map(item => item.productId))];
      const productsResult = await this.productRepository.findByIds(productIds);
      const productMap = new Map((productsResult.data ?? []).map(p => [p.id, p]));

      return items.reduce((total, item) => {
        const product = productMap.get(item.productId);
        return total + ((product?.weight ?? 0.5) * item.quantity);
      }, 0);
    } catch {
      // Fall back to estimate if products can't be fetched
      return items.reduce((total, item) => total + (item.quantity * 0.5), 0);
    }
  }

  private async handleOrderCancellation(order: Order): Promise<void> {
    try {
      // Restore stock — completeReservation already decremented it at order creation,
      // so we add back the quantities rather than trying to release a completed reservation.
      if (order.items) {
        await Promise.all(
          order.items.map(item => this.inventoryService.updateStock(item.productId, item.quantity))
        );
      }

      // Process refund if a payment was made
      if (order.paymentId) {
        const refundResult = await this.paymentService.refundPayment(order.paymentId);
        if (!refundResult.success) {
          console.error(`Refund failed for payment ${order.paymentId}: ${refundResult.error}`);
        }
      }

    } catch (error) {
      console.error('Failed to handle order cancellation:', error);
    }
  }

}
