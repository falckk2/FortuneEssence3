// Stripe Payment Provider Implementation
// Following Open/Closed Principle - implements IPaymentProvider interface

import { injectable } from 'tsyringe';
import Stripe from 'stripe';
import { BasePaymentProvider, PaymentData, PaymentResult } from '../IPaymentProvider';
import { ApiResponse } from '@/types';
import { config } from '@/config';

@injectable()
export class StripePaymentProvider extends BasePaymentProvider {
  readonly name = 'Stripe';
  readonly supportedCurrencies = ['SEK', 'EUR', 'USD', 'GBP'];
  readonly supportedCountries = ['SE', 'NO', 'DK', 'FI', 'US', 'GB', 'DE', 'FR'];

  private stripe: Stripe;

  constructor() {
    super();
    const apiKey = config.payments.stripe.secretKey;

    if (!apiKey) {
      throw new Error('Stripe API key not configured. Set STRIPE_SECRET_KEY environment variable.');
    }

    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    });
  }

  async processPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      // Validate payment data
      const validationError = this.validatePaymentData(paymentData);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Convert amount to smallest currency unit (öre for SEK, cents for other currencies)
      const amountInSmallestUnit = Math.round(paymentData.amount * 100);

      // Create payment intent with Stripe
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInSmallestUnit,
        currency: paymentData.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          orderId: paymentData.orderId,
          customerId: paymentData.customerId,
          ...(paymentData.metadata || {}),
        },
        description: `Order ${paymentData.orderId} for customer ${paymentData.customerId}`,
      });

      // Map Stripe status to our PaymentResult status
      const status = this.mapStripeStatus(paymentIntent.status);

      const paymentResult: PaymentResult = {
        paymentId: paymentIntent.id,
        status,
        transactionId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
      };

      return {
        success: true,
        data: paymentResult,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error('Stripe payment error:', {
          type: error.type,
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        });

        return {
          success: false,
          error: `Stripe payment failed: ${error.message}`,
        };
      }

      console.error('Unexpected error during Stripe payment:', error);
      return {
        success: false,
        error: `Stripe payment failed: ${error}`,
      };
    }
  }

  async verifyPayment(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      // Payment is verified if it's succeeded or processing
      const isVerified = paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing';

      return {
        success: true,
        data: isVerified,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error('Stripe verify payment error:', {
          type: error.type,
          code: error.code,
          message: error.message,
          paymentId,
        });

        return {
          success: false,
          error: `Failed to verify Stripe payment: ${error.message}`,
        };
      }

      console.error('Unexpected error verifying Stripe payment:', error);
      return {
        success: false,
        error: `Failed to verify Stripe payment: ${error}`,
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<void>> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentId,
      };

      // If partial refund amount is specified, convert to smallest unit
      if (amount !== undefined) {
        refundData.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundData);

      // Check if refund was successful
      if (refund.status === 'failed') {
        return {
          success: false,
          error: `Refund failed: ${refund.failure_reason || 'Unknown reason'}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error('Stripe refund error:', {
          type: error.type,
          code: error.code,
          message: error.message,
          paymentId,
        });

        return {
          success: false,
          error: `Failed to refund Stripe payment: ${error.message}`,
        };
      }

      console.error('Unexpected error refunding Stripe payment:', error);
      return {
        success: false,
        error: `Failed to refund Stripe payment: ${error}`,
      };
    }
  }

  async cancelPayment(paymentId: string): Promise<ApiResponse<void>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentId);

      if (paymentIntent.status !== 'canceled') {
        return {
          success: false,
          error: `Failed to cancel payment. Current status: ${paymentIntent.status}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error('Stripe cancel payment error:', {
          type: error.type,
          code: error.code,
          message: error.message,
          paymentId,
        });

        return {
          success: false,
          error: `Failed to cancel Stripe payment: ${error.message}`,
        };
      }

      console.error('Unexpected error canceling Stripe payment:', error);
      return {
        success: false,
        error: `Failed to cancel Stripe payment: ${error}`,
      };
    }
  }

  // Helper method to retrieve payment intent
  async getPaymentIntent(paymentId: string): Promise<ApiResponse<Stripe.PaymentIntent>> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error('Stripe get payment intent error:', {
          type: error.type,
          code: error.code,
          message: error.message,
          paymentId,
        });

        return {
          success: false,
          error: `Failed to retrieve payment intent: ${error.message}`,
        };
      }

      console.error('Unexpected error retrieving payment intent:', error);
      return {
        success: false,
        error: `Failed to retrieve payment intent: ${error}`,
      };
    }
  }

  // Helper method to capture authorized payment
  async capturePayment(paymentId: string, amount?: number): Promise<ApiResponse<Stripe.PaymentIntent>> {
    try {
      const captureParams: Stripe.PaymentIntentCaptureParams = {};

      // If partial capture amount is specified, convert to smallest unit
      if (amount !== undefined) {
        captureParams.amount_to_capture = Math.round(amount * 100);
      }

      const paymentIntent = await this.stripe.paymentIntents.capture(
        paymentId,
        captureParams
      );

      return {
        success: true,
        data: paymentIntent,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        console.error('Stripe capture payment error:', {
          type: error.type,
          code: error.code,
          message: error.message,
          paymentId,
        });

        return {
          success: false,
          error: `Failed to capture payment: ${error.message}`,
        };
      }

      console.error('Unexpected error capturing payment:', error);
      return {
        success: false,
        error: `Failed to capture payment: ${error}`,
      };
    }
  }

  // Helper method to map Stripe status to our PaymentResult status
  private mapStripeStatus(stripeStatus: Stripe.PaymentIntent.Status): 'success' | 'failed' | 'pending' {
    switch (stripeStatus) {
      case 'succeeded':
        return 'success';
      case 'processing':
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'requires_capture':
        return 'pending';
      case 'canceled':
      default:
        return 'failed';
    }
  }

  // Helper method to verify and construct webhook events
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): ApiResponse<Stripe.Event> {
    try {
      const webhookSecret = config.payments.stripe.webhookSecret;

      if (!webhookSecret) {
        return {
          success: false,
          error: 'Stripe webhook secret not configured. Set STRIPE_WEBHOOK_SECRET environment variable.',
        };
      }

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      return {
        success: true,
        data: event,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        console.error('Stripe webhook signature verification failed:', error.message);

        return {
          success: false,
          error: 'Webhook signature verification failed',
        };
      }

      console.error('Unexpected error constructing webhook event:', error);
      return {
        success: false,
        error: `Failed to construct webhook event: ${error}`,
      };
    }
  }
}
