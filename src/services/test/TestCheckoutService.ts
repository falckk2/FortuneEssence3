import {
  ITestCheckoutService,
  TestOrderDTO,
  TestOrderResult,
  IValidationPipeline,
} from '@/interfaces/test';
import {
  ICartService,
  IShippingService,
  IInventoryService,
  IProductService,
} from '@/interfaces';
import { IEmailService } from '@/interfaces/email';
import { ApiResponse } from '@/types';

/**
 * Test Checkout Service
 *
 * Single Responsibility: Handle test checkout orchestration
 * Dependencies injected via constructor (Dependency Inversion Principle)
 */
export class TestCheckoutService implements ITestCheckoutService {
  constructor(
    private cartService: ICartService,
    private shippingService: IShippingService,
    private inventoryService: IInventoryService,
    private productService: IProductService,
    private orderRepository: any, // Should be IOrderRepository
    private emailService: IEmailService,
    private validationPipeline: IValidationPipeline<TestOrderDTO>
  ) {}

  async processTestCheckout(orderData: TestOrderDTO): Promise<ApiResponse<TestOrderResult>> {
    try {
      // Step 1: Inject dummy shippingRateId if missing (test mode convenience)
      if (!orderData.shippingRateId) {
        orderData.shippingRateId = '00000000-0000-0000-0000-000000000000';
        console.log('🧪 TEST MODE: Using dummy shippingRateId');
      }

      // Step 2: Validate order data
      const validationResult = this.validationPipeline.validate(orderData);
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error || 'Validation failed',
        };
      }

      console.log('🧪 TEST MODE: Simulating payment for order...');

      // Step 3: Calculate totals
      const { subtotal, tax, shippingCost, totalAmount } = await this.calculateTotals(orderData);

      // Step 4: Generate mock payment ID
      const mockPaymentId = this.generateMockPaymentId();
      console.log('🧪 TEST MODE: Payment simulated successfully');
      console.log('🧪 TEST MODE: Mock Payment ID:', mockPaymentId);
      console.log('🧪 TEST MODE: Total Amount:', totalAmount, 'SEK');

      // Step 5: Validate and reserve stock
      const stockReservation = await this.validateAndReserveStock(orderData.items);
      if (!stockReservation.success) {
        return {
          success: false,
          error: stockReservation.error,
        };
      }

      // Step 6: Transform items and create order
      const orderItems = await this.transformOrderItems(orderData.items);
      if (!orderItems.success) {
        await this.inventoryService.releaseReservation(stockReservation.data!);
        return {
          success: false,
          error: orderItems.error,
        };
      }

      // Step 7: Create order in database
      const orderResult = await this.createOrder(
        orderData,
        orderItems.data!,
        subtotal,
        tax,
        shippingCost,
        totalAmount,
        mockPaymentId
      );

      if (!orderResult.success) {
        await this.inventoryService.releaseReservation(stockReservation.data!);
        return {
          success: false,
          error: orderResult.error,
        };
      }

      const order = orderResult.data!;

      // Step 8: Complete stock reservation
      await this.inventoryService.completeReservation(stockReservation.data!);
      console.log('🧪 TEST MODE: Order created successfully:', order.id);

      // Step 9: Generate shipping label
      const shippingLabel = await this.generateShippingLabel(order);

      // Step 10: Clear cart
      await this.clearCustomerCart(orderData.customerId);

      // Step 11: Send confirmation email
      await this.sendOrderConfirmation(orderData, order, {
        subtotal,
        tax,
        shippingCost,
        trackingNumber: shippingLabel?.trackingNumber,
      });

      // Step 12: Return result
      return {
        success: true,
        data: {
          order: {
            id: order.id,
            customerId: order.customerId,
            items: order.items,
            subtotal,
            tax: order.tax,
            shipping: order.shipping,
            total: order.total,
            paymentId: order.paymentId,
            paymentStatus: 'confirmed',
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress,
            paymentMethod: order.paymentMethod,
            carrier: order.carrier,
          },
          payment: {
            paymentId: order.paymentId,
            status: 'success',
            testMode: true,
            message: 'Payment simulated - no actual charge made',
          },
          shippingLabel: shippingLabel
            ? {
                trackingNumber: shippingLabel.trackingNumber,
                carrierCode: shippingLabel.carrierCode,
                labelUrl: shippingLabel.labelPdfUrl,
              }
            : null,
          message: '✅ TEST ORDER CREATED - No real payment was processed',
        },
      };
    } catch (error) {
      console.error('🧪 TEST MODE: Error creating test order:', error);
      return {
        success: false,
        error: `Test checkout failed: ${error}`,
      };
    }
  }

  private async calculateTotals(orderData: TestOrderDTO) {
    // Prices are inclusive of 25% Swedish VAT
    const subtotal = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    // Extract VAT from the price (varav moms): price / 1.25 * 0.25
    const tax = Math.round((subtotal / 1.25) * 0.25 * 100) / 100;

    const shippingResult = await this.shippingService.calculateShipping(
      orderData.items,
      orderData.shippingAddress.country
    );

    if (!shippingResult.success) {
      throw new Error(`Shipping calculation failed: ${shippingResult.error}`);
    }

    const shippingCost = shippingResult.data!.price;
    const totalAmount = subtotal + shippingCost;

    return { subtotal, tax, shippingCost, totalAmount };
  }

  private generateMockPaymentId(): string {
    return `test_payment_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private async validateAndReserveStock(
    items: Array<{ productId: string; quantity: number; price: number }>
  ): Promise<ApiResponse<any>> {
    // Validate stock availability
    for (const item of items) {
      const availability = await this.inventoryService.checkAvailability(
        item.productId,
        item.quantity
      );
      if (!availability.success || !availability.data) {
        return {
          success: false,
          error: `Product ${item.productId} is not available in requested quantity`,
        };
      }
    }

    // Reserve stock
    const stockReservation = await this.inventoryService.reserveStock(items);
    if (!stockReservation.success) {
      return {
        success: false,
        error: `Stock reservation failed: ${stockReservation.error}`,
      };
    }

    return stockReservation;
  }

  private async transformOrderItems(
    items: Array<{ productId: string; quantity: number; price: number }>
  ): Promise<ApiResponse<any[]>> {
    const orderItems = [];

    for (const cartItem of items) {
      const productResult = await this.productService.getProduct(cartItem.productId);
      if (!productResult.success || !productResult.data) {
        return {
          success: false,
          error: `Product with ID ${cartItem.productId} not found`,
        };
      }

      orderItems.push({
        productId: cartItem.productId,
        productName: productResult.data.name,
        quantity: cartItem.quantity,
        price: cartItem.price,
        total: cartItem.price * cartItem.quantity,
      });
    }

    return {
      success: true,
      data: orderItems,
    };
  }

  private async createOrder(
    orderData: TestOrderDTO,
    orderItems: any[],
    subtotal: number,
    tax: number,
    shippingCost: number,
    totalAmount: number,
    mockPaymentId: string
  ) {
    const testOrder = {
      customerId: orderData.customerId,
      items: orderItems,
      total: totalAmount,
      tax,
      shipping: shippingCost,
      status: 'confirmed' as const,
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress,
      paymentMethod: orderData.paymentMethod,
      paymentId: mockPaymentId,
      trackingNumber: undefined,
    };

    return await this.orderRepository.create(testOrder);
  }

  private async generateShippingLabel(order: any) {
    try {
      const labelResult = await this.shippingService.generateShippingLabel(order);
      if (labelResult.success && labelResult.data) {
        console.log(
          '🧪 TEST MODE: Shipping label generated:',
          labelResult.data.trackingNumber
        );

        // Save tracking number back to the order
        await this.orderRepository.update(order.id, {
          trackingNumber: labelResult.data.trackingNumber,
          carrier: labelResult.data.carrierCode,
        });
        console.log('🧪 TEST MODE: Tracking number saved to order');

        return labelResult.data;
      } else {
        console.warn('🧪 TEST MODE: Label generation failed:', labelResult.error);
      }
    } catch (labelError) {
      console.error('🧪 TEST MODE: Error generating shipping label:', labelError);
    }
    return null;
  }

  private async clearCustomerCart(customerId: string) {
    try {
      const cartResult = await this.cartService.getCart(customerId);
      if (cartResult.success && cartResult.data) {
        await this.cartService.clearCart(cartResult.data.id);
        console.log('🧪 TEST MODE: Cart cleared');
      }
    } catch (error) {
      console.error('🧪 TEST MODE: Error clearing cart:', error);
    }
  }

  private async sendOrderConfirmation(
    orderData: TestOrderDTO,
    order: any,
    costs: { subtotal: number; tax: number; shippingCost: number; trackingNumber?: string }
  ) {
    try {
      const customerEmail = orderData.email;
      const customerName = `${orderData.shippingAddress.firstName || ''} ${
        orderData.shippingAddress.lastName || ''
      }`.trim();

      if (customerEmail) {
        await this.emailService.sendOrderConfirmation(
          customerEmail,
          {
            orderId: order.id,
            customerName: customerName || 'Kund',
            items: order.items.map((item: any) => ({
              name: item.productName,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: costs.subtotal,
            tax: costs.tax,
            shippingCost: costs.shippingCost,
            total: order.total,
            shippingAddress: this.formatAddress(orderData.shippingAddress),
            trackingNumber: costs.trackingNumber,
          },
          'sv'
        );
        console.log('🧪 TEST MODE: Order confirmation email sent to', customerEmail);
      }
    } catch (emailError) {
      console.error('🧪 TEST MODE: Error sending email:', emailError);
    }
  }

  private formatAddress(address: any): string {
    if (!address) return '';

    const parts = [
      address.street || '',
      address.postalCode && address.city
        ? `${address.postalCode} ${address.city}`
        : address.city || address.postalCode || '',
      address.country || '',
    ].filter((part) => part.trim() !== '');

    return parts.join('\n');
  }
}
