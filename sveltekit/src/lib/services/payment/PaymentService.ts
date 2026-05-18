import { injectable, inject } from 'tsyringe';
import { IPaymentService, PaymentData, PaymentResult, SwishPayment, KlarnaSession, KlarnaOrderData } from '$lib/interfaces';
import { ApiResponse } from '$lib/types';
import Stripe from 'stripe';
import { config } from '$lib/config';
import { TOKENS } from '$lib/config/di-container';
import { PaymentProcessorRegistry } from './PaymentProcessorRegistry';
import { StripePaymentProcessor } from './processors/StripePaymentProcessor';
import { SwishPaymentProcessor } from './processors/SwishPaymentProcessor';
import { KlarnaPaymentProcessor } from './processors/KlarnaPaymentProcessor';
import { BankTransferPaymentProcessor } from './processors/BankTransferPaymentProcessor';

/**
 * Payment Service
 *
 * Orchestrates payment processing by delegating to payment processors.
 * - Open/Closed: Add new payment methods via processors without modifying this class
 * - Dependency Inversion: Stripe client injected rather than constructed internally
 */
@injectable()
export class PaymentService implements IPaymentService {
  private processorRegistry: PaymentProcessorRegistry;

  constructor(
    @inject(TOKENS.Stripe) private readonly stripe: Stripe
  ) {
    this.processorRegistry = new PaymentProcessorRegistry();
    this.registerPaymentProcessors();
  }

  private registerPaymentProcessors(): void {
    this.processorRegistry.register(new StripePaymentProcessor());
    this.processorRegistry.register(new SwishPaymentProcessor());
    this.processorRegistry.register(new KlarnaPaymentProcessor());
    this.processorRegistry.register(new BankTransferPaymentProcessor());
  }

  async processPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      const processor = this.processorRegistry.getProcessor(paymentData.method);

      if (!processor) {
        return {
          success: false,
          error: `Unsupported payment method: ${paymentData.method}`,
        };
      }

      return await processor.process(paymentData);
    } catch (error) {
      return {
        success: false,
        error: `Payment processing failed: ${error}`,
      };
    }
  }

  async verifyPayment(paymentId: string, method: string): Promise<ApiResponse<boolean>> {
    try {
      const processor = this.processorRegistry.getProcessor(method);

      if (!processor) {
        return {
          success: false,
          error: `Unsupported payment method: ${method}`,
        };
      }

      return await processor.verify(paymentId);
    } catch (error) {
      return {
        success: false,
        error: `Payment verification failed: ${error}`,
      };
    }
  }

  async createSwishPayment(amount: number, phone: string, message: string): Promise<ApiResponse<SwishPayment>> {
    if (!config.payments.swish.merchantId) {
      return {
        success: false,
        error: 'Swish is not configured',
      };
    }

    const swedishPhoneRegex = /^(\+46|0)[1-9]\d{8,9}$/;
    if (!swedishPhoneRegex.test(phone.replace(/\s/g, ''))) {
      return {
        success: false,
        error: 'Invalid Swedish phone number format',
      };
    }

    const paymentId = `swish_${crypto.randomUUID()}`;
    const qrData = `swish://payment?token=${paymentId}&amount=${amount}&message=${encodeURIComponent(message)}`;
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    const deepLink = `swish://payment?token=${paymentId}&amount=${amount}`;

    return {
      success: true,
      data: { paymentId, qrCode, deepLink, status: 'pending' },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createKlarnaSession(_orderData: KlarnaOrderData): Promise<ApiResponse<KlarnaSession>> {
    if (!config.payments.klarna.username || !config.payments.klarna.password) {
      return {
        success: false,
        error: 'Klarna is not configured',
      };
    }

    const sessionId = `klarna_${crypto.randomUUID()}`;
    const clientToken = crypto.randomUUID();

    return {
      success: true,
      data: {
        sessionId,
        clientToken,
        paymentMethods: ['pay_later', 'pay_over_time', 'pay_now'],
      },
    };
  }

  async createPaymentIntent(amount: number, currency: string = 'SEK'): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>> {
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
        data: {
          clientSecret: paymentIntent.client_secret!,
          paymentIntentId: paymentIntent.id,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Failed to create payment intent: ${message}`,
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: `Refund failed: ${message}`,
      };
    }
  }

  async getPaymentMethods(): Promise<ApiResponse<Array<{ id: string; name: string; enabled: boolean }>>> {
    const methods: Array<{ id: string; name: string; enabled: boolean }> = [];

    if (config.payments.stripe.secretKey) {
      methods.push({ id: 'card', name: 'Card', enabled: true });
    }

    if (config.payments.swish.merchantId) {
      methods.push({ id: 'swish', name: 'Swish', enabled: true });
    }

    if (config.payments.klarna.username) {
      methods.push({ id: 'klarna', name: 'Klarna', enabled: true });
    }

    methods.push({ id: 'bank-transfer', name: 'Bank Transfer', enabled: true });

    return {
      success: true,
      data: methods,
    };
  }
}
