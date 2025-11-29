import { IPaymentService, PaymentData, PaymentResult, SwishPayment, KlarnaSession, KlarnaOrderData } from '@/interfaces/services';
import { ApiResponse } from '@/types';
import Stripe from 'stripe';
import { config } from '@/config';

export class PaymentService implements IPaymentService {
  private stripe: Stripe;

  constructor() {
    if (!config.payments.stripe.secretKey) {
      throw new Error('Stripe secret key is not configured');
    }
    
    this.stripe = new Stripe(config.payments.stripe.secretKey, {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async processPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      switch (paymentData.method) {
        case 'card':
          return this.processCardPayment(paymentData);
        case 'swish':
          return this.processSwishPayment(paymentData);
        case 'klarna':
          return this.processKlarnaPayment(paymentData);
        case 'bank-transfer':
          return this.processBankTransfer(paymentData);
        default:
          return {
            success: false,
            error: 'Unsupported payment method',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Payment processing failed: ${error}`,
      };
    }
  }

  private async processCardPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to öre (Swedish cents)
        currency: paymentData.currency.toLowerCase(),
        metadata: {
          orderId: paymentData.orderId,
          customerId: paymentData.customerId,
          ...paymentData.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: {
          paymentId: paymentIntent.id,
          status: paymentIntent.status === 'succeeded' ? 'success' : 'pending',
          transactionId: paymentIntent.id,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Card payment failed: ${error.message}`,
      };
    }
  }

  async createSwishPayment(amount: number, phone: string, message: string): Promise<ApiResponse<SwishPayment>> {
    try {
      // In a real implementation, this would call the Swish API
      // For now, we'll simulate the Swish payment creation
      
      if (!config.payments.swish.merchantId) {
        return {
          success: false,
          error: 'Swish is not configured',
        };
      }

      // Validate Swedish phone number format
      const swedishPhoneRegex = /^(\+46|0)[1-9]\d{8,9}$/;
      if (!swedishPhoneRegex.test(phone.replace(/\s/g, ''))) {
        return {
          success: false,
          error: 'Invalid Swedish phone number format',
        };
      }

      // Generate mock Swish payment
      const paymentId = `swish_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const qrCode = this.generateSwishQRCode(paymentId, amount, message);
      const deepLink = `swish://payment?token=${paymentId}&amount=${amount}`;

      const swishPayment: SwishPayment = {
        paymentId,
        qrCode,
        deepLink,
        status: 'pending',
      };

      return {
        success: true,
        data: swishPayment,
      };
    } catch (error) {
      return {
        success: false,
        error: `Swish payment creation failed: ${error}`,
      };
    }
  }

  private async processSwishPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      // In production, this would integrate with the actual Swish API
      const swishResult = await this.createSwishPayment(
        paymentData.amount,
        paymentData.metadata?.phone || '',
        `Fortune Essence Order ${paymentData.orderId}`
      );

      if (!swishResult.success) {
        return {
          success: false,
          error: swishResult.error,
        };
      }

      return {
        success: true,
        data: {
          paymentId: swishResult.data!.paymentId,
          status: 'pending',
          redirectUrl: swishResult.data!.deepLink,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Swish payment failed: ${error}`,
      };
    }
  }

  async createKlarnaSession(orderData: KlarnaOrderData): Promise<ApiResponse<KlarnaSession>> {
    try {
      if (!config.payments.klarna.username || !config.payments.klarna.password) {
        return {
          success: false,
          error: 'Klarna is not configured',
        };
      }

      // In a real implementation, this would call the Klarna API
      // For now, we'll simulate the Klarna session creation
      
      const sessionId = `klarna_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const clientToken = `client_${Math.random().toString(36).substring(7)}`;

      const klarnaSession: KlarnaSession = {
        sessionId,
        clientToken,
        paymentMethods: ['pay_later', 'pay_over_time', 'pay_now'],
      };

      return {
        success: true,
        data: klarnaSession,
      };
    } catch (error) {
      return {
        success: false,
        error: `Klarna session creation failed: ${error}`,
      };
    }
  }

  private async processKlarnaPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      // Mock Klarna order data
      const orderData: KlarnaOrderData = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        locale: 'sv-SE',
        orderLines: [
          {
            name: `Order ${paymentData.orderId}`,
            quantity: 1,
            unitPrice: paymentData.amount,
            totalAmount: paymentData.amount,
          }
        ],
        shippingAddress: paymentData.metadata?.shippingAddress || {},
        billingAddress: paymentData.metadata?.billingAddress || {},
      };

      const klarnaResult = await this.createKlarnaSession(orderData);

      if (!klarnaResult.success) {
        return {
          success: false,
          error: klarnaResult.error,
        };
      }

      return {
        success: true,
        data: {
          paymentId: klarnaResult.data!.sessionId,
          status: 'pending',
          redirectUrl: `/checkout/klarna?session=${klarnaResult.data!.sessionId}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Klarna payment failed: ${error}`,
      };
    }
  }

  private async processBankTransfer(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      // Generate bank transfer instructions
      const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      return {
        success: true,
        data: {
          paymentId: transferId,
          status: 'pending',
          redirectUrl: `/checkout/bank-transfer?reference=${transferId}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Bank transfer setup failed: ${error}`,
      };
    }
  }

  async verifyPayment(paymentId: string, method: string): Promise<ApiResponse<boolean>> {
    try {
      switch (method) {
        case 'card':
          return this.verifyStripePayment(paymentId);
        case 'swish':
          return this.verifySwishPayment(paymentId);
        case 'klarna':
          return this.verifyKlarnaPayment(paymentId);
        case 'bank-transfer':
          return this.verifyBankTransfer(paymentId);
        default:
          return {
            success: false,
            error: 'Unsupported payment method',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Payment verification failed: ${error}`,
      };
    }
  }

  private async verifyStripePayment(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
      
      return {
        success: true,
        data: paymentIntent.status === 'succeeded',
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Stripe verification failed: ${error.message}`,
      };
    }
  }

  private async verifySwishPayment(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      // In production, this would check the actual Swish payment status
      // For now, we'll simulate verification
      
      // Mock verification logic - in reality, you'd call Swish API
      const isVerified = Math.random() > 0.1; // 90% success rate for demo
      
      return {
        success: true,
        data: isVerified,
      };
    } catch (error) {
      return {
        success: false,
        error: `Swish verification failed: ${error}`,
      };
    }
  }

  private async verifyKlarnaPayment(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      // In production, this would check the actual Klarna payment status
      // For now, we'll simulate verification
      
      return {
        success: true,
        data: true, // Mock successful verification
      };
    } catch (error) {
      return {
        success: false,
        error: `Klarna verification failed: ${error}`,
      };
    }
  }

  private async verifyBankTransfer(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      // Bank transfers require manual verification
      // This would typically check against bank statements or webhooks
      
      return {
        success: true,
        data: false, // Bank transfers are not immediately verifiable
      };
    } catch (error) {
      return {
        success: false,
        error: `Bank transfer verification failed: ${error}`,
      };
    }
  }

  // Utility methods
  private generateSwishQRCode(paymentId: string, amount: number, message: string): string {
    // In production, this would generate a proper QR code
    // For now, we'll return a mock QR code URL
    const qrData = `swish://payment?token=${paymentId}&amount=${amount}&message=${encodeURIComponent(message)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  }

  async createPaymentIntent(amount: number, currency: string = 'SEK'): Promise<ApiResponse<string>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        data: paymentIntent.client_secret!,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to create payment intent: ${error.message}`,
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<string>> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return {
        success: true,
        data: refund.id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Refund failed: ${error.message}`,
      };
    }
  }

  async getPaymentMethods(): Promise<ApiResponse<string[]>> {
    try {
      const methods = ['card'];
      
      if (config.payments.swish.merchantId) {
        methods.push('swish');
      }
      
      if (config.payments.klarna.username) {
        methods.push('klarna');
      }
      
      methods.push('bank-transfer');

      return {
        success: true,
        data: methods,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get payment methods: ${error}`,
      };
    }
  }
}