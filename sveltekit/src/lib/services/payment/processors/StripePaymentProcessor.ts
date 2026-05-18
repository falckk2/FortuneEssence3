import { IPaymentProcessor } from '$lib/interfaces/payment';
import { PaymentData, PaymentResult } from '$lib/interfaces/services';
import { ApiResponse } from '$lib/types';
import Stripe from 'stripe';
import { config } from '$lib/config';

/**
 * Stripe Payment Processor
 * Handles card payments through Stripe
 *
 * Follows Open/Closed Principle:
 * - Open for extension: Can be extended for specific Stripe features
 * - Closed for modification: Payment service doesn't need to change when Stripe logic changes
 */
export class StripePaymentProcessor implements IPaymentProcessor {
  private stripe: Stripe;

  constructor() {
    const stripeKey = config.payments.stripe.secretKey || 'sk_test_placeholder';

    if (!config.payments.stripe.secretKey && typeof window === 'undefined') {
      console.warn('Warning: Stripe secret key is not configured');
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  getMethod(): string {
    return 'card';
  }

  async process(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
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
          status: paymentIntent.status === 'succeeded' ? 'succeeded' : paymentIntent.status === 'requires_payment_method' ? 'failed' : 'pending',
          clientSecret: paymentIntent.client_secret ?? undefined,
          amount: paymentData.amount,
          currency: paymentData.currency,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Stripe payment failed: ${error}`,
      };
    }
  }

  async verify(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
      const isVerified = paymentIntent.status === 'succeeded';

      return {
        success: true,
        data: isVerified,
      };
    } catch (error) {
      return {
        success: false,
        error: `Payment verification failed: ${error}`,
      };
    }
  }
}
