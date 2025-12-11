// Klarna Payment Provider Implementation
// Following Open/Closed Principle - implements IPaymentProvider interface

import { injectable } from 'tsyringe';
import { BasePaymentProvider, PaymentData, PaymentResult } from '../IPaymentProvider';
import { ApiResponse } from '@/types';
import { config } from '@/config';

/**
 * KlarnaPaymentProvider - Handles Klarna Checkout and Payments integration
 *
 * Klarna offers "Buy Now, Pay Later" options popular in Nordic countries.
 * This provider integrates with Klarna Checkout API for session creation and order management.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Handles only Klarna-specific payment operations
 * - Open/Closed: Extends BasePaymentProvider without modifying it
 * - Liskov Substitution: Can be used anywhere IPaymentProvider is expected
 * - Dependency Inversion: Depends on config abstraction, not concrete implementations
 */

interface KlarnaOrderLine {
  type?: 'physical' | 'digital' | 'shipping_fee' | 'discount';
  reference?: string;
  name: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  total_amount: number;
  total_tax_amount?: number;
}

interface KlarnaAddress {
  given_name?: string;
  family_name?: string;
  email?: string;
  street_address?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  phone?: string;
}

interface KlarnaCheckoutSession {
  order_id?: string;
  order_amount: number;
  order_tax_amount?: number;
  order_lines: KlarnaOrderLine[];
  purchase_country: string;
  purchase_currency: string;
  locale: string;
  merchant_urls: {
    terms: string;
    checkout: string;
    confirmation: string;
    push: string;
  };
  billing_address?: KlarnaAddress;
  shipping_address?: KlarnaAddress;
}

interface KlarnaCheckoutResponse {
  order_id: string;
  html_snippet: string;
  status?: string;
}

interface KlarnaOrder {
  order_id: string;
  status: 'checkout_incomplete' | 'checkout_complete' | 'AUTHORIZED' | 'PART_CAPTURED' | 'CAPTURED' | 'CANCELLED' | 'EXPIRED';
  order_amount: number;
  authorized_payment_method?: any;
}

interface KlarnaCaptureRequest {
  captured_amount: number;
  order_lines?: KlarnaOrderLine[];
}

@injectable()
export class KlarnaPaymentProvider extends BasePaymentProvider {
  readonly name = 'Klarna';
  readonly supportedCurrencies = ['SEK', 'EUR', 'NOK', 'DKK'];
  readonly supportedCountries = ['SE', 'NO', 'DK', 'FI', 'DE', 'AT', 'NL', 'GB'];

  private readonly username: string;
  private readonly password: string;
  private readonly baseUrl: string;

  constructor() {
    super();
    this.username = config.payments.klarna.username;
    this.password = config.payments.klarna.password;
    this.baseUrl = config.payments.klarna.baseUrl;
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

      // Klarna requires order lines in metadata
      if (!paymentData.metadata?.orderLines) {
        return {
          success: false,
          error: 'Order lines are required for Klarna payments',
        };
      }

      // Validate credentials
      if (!this.username || !this.password) {
        return {
          success: false,
          error: 'Klarna credentials are not configured',
        };
      }

      // Create checkout session
      const session = await this.createSession(paymentData);

      if (!session.success || !session.data) {
        return {
          success: false,
          error: session.error || 'Failed to create Klarna session',
        };
      }

      return {
        success: true,
        data: {
          paymentId: session.data.order_id,
          status: 'pending',
          redirectUrl: `${config.app.url}/checkout/klarna?session=${session.data.order_id}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Klarna payment failed: ${error}`,
      };
    }
  }

  async verifyPayment(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      // Get order from Klarna
      const order = await this.getOrder(paymentId);

      if (!order.success || !order.data) {
        return {
          success: false,
          error: order.error || 'Failed to get Klarna order',
        };
      }

      // Check if payment is authorized or captured
      const isVerified = ['AUTHORIZED', 'CAPTURED', 'PART_CAPTURED'].includes(order.data.status);

      return {
        success: true,
        data: isVerified,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to verify Klarna payment: ${error}`,
      };
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<void>> {
    try {
      // Get order details
      const order = await this.getOrder(paymentId);

      if (!order.success || !order.data) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      // Klarna refunds are done through the order management API
      // Amount is in minor units (öre for SEK)
      const refundAmount = amount ? Math.round(amount * 100) : order.data.order_amount;

      const response = await this.makeKlarnaRequest(
        `/ordermanagement/v1/orders/${paymentId}/refunds`,
        'POST',
        {
          refunded_amount: refundAmount,
        }
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to refund Klarna payment',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to refund Klarna payment: ${error}`,
      };
    }
  }

  /**
   * Create a Klarna checkout session
   */
  async createSession(paymentData: PaymentData): Promise<ApiResponse<KlarnaCheckoutResponse>> {
    try {
      // Parse order lines from metadata
      const orderLines: KlarnaOrderLine[] = JSON.parse(paymentData.metadata?.orderLines || '[]');

      // Convert order lines to Klarna format (amounts in minor units - öre for SEK)
      const klarnaOrderLines = orderLines.map(line => ({
        type: line.type || 'physical',
        reference: line.reference,
        name: line.name,
        quantity: line.quantity,
        unit_price: Math.round(line.unit_price * 100),
        tax_rate: line.tax_rate || 2500, // Default 25% Swedish VAT
        total_amount: Math.round(line.total_amount * 100),
        total_tax_amount: line.total_tax_amount ? Math.round(line.total_tax_amount * 100) : Math.round(line.total_amount * 100 * 0.2),
      }));

      // Parse addresses if provided
      const shippingAddress = paymentData.metadata?.shippingAddress
        ? JSON.parse(paymentData.metadata.shippingAddress)
        : undefined;

      const billingAddress = paymentData.metadata?.billingAddress
        ? JSON.parse(paymentData.metadata.billingAddress)
        : undefined;

      // Create session request
      const sessionRequest: KlarnaCheckoutSession = {
        order_amount: Math.round(paymentData.amount * 100),
        order_tax_amount: Math.round(paymentData.amount * 100 * 0.2), // Simplified - 20% VAT
        order_lines: klarnaOrderLines,
        purchase_country: paymentData.metadata?.country || 'SE',
        purchase_currency: paymentData.currency,
        locale: paymentData.metadata?.locale || 'sv-SE',
        merchant_urls: {
          terms: `${config.app.url}/terms`,
          checkout: `${config.app.url}/checkout`,
          confirmation: `${config.app.url}/checkout/confirmation?order_id={checkout.order.id}`,
          push: `${config.app.url}/api/webhooks/klarna?order_id={checkout.order.id}`,
        },
        shipping_address: shippingAddress,
        billing_address: billingAddress,
      };

      const response = await this.makeKlarnaRequest<KlarnaCheckoutResponse>(
        '/checkout/v3/orders',
        'POST',
        sessionRequest
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to create Klarna session: ${error}`,
      };
    }
  }

  /**
   * Get order details from Klarna
   */
  async getOrder(orderId: string): Promise<ApiResponse<KlarnaOrder>> {
    try {
      const response = await this.makeKlarnaRequest<KlarnaOrder>(
        `/ordermanagement/v1/orders/${orderId}`,
        'GET'
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get Klarna order: ${error}`,
      };
    }
  }

  /**
   * Capture an authorized Klarna order
   */
  async captureOrder(orderId: string, amount?: number): Promise<ApiResponse<void>> {
    try {
      const order = await this.getOrder(orderId);

      if (!order.success || !order.data) {
        return {
          success: false,
          error: 'Order not found',
        };
      }

      const captureAmount = amount ? Math.round(amount * 100) : order.data.order_amount;

      const captureRequest: KlarnaCaptureRequest = {
        captured_amount: captureAmount,
      };

      const response = await this.makeKlarnaRequest(
        `/ordermanagement/v1/orders/${orderId}/captures`,
        'POST',
        captureRequest
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to capture Klarna order',
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to capture Klarna order: ${error}`,
      };
    }
  }

  /**
   * Make authenticated request to Klarna API
   * Uses Basic Auth with username:password
   */
  private async makeKlarnaRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      };

      const options: RequestInit = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) }),
      };

      const response = await fetch(url, options);
      const responseData = await response.text();

      if (!response.ok) {
        return {
          success: false,
          error: `Klarna API error: ${response.status} - ${responseData}`,
        };
      }

      // Some endpoints return empty response on success
      if (!responseData) {
        return {
          success: true,
          data: {} as T,
        };
      }

      const parsedData = JSON.parse(responseData);

      return {
        success: true,
        data: parsedData as T,
      };
    } catch (error) {
      return {
        success: false,
        error: `Klarna API request failed: ${error}`,
      };
    }
  }
}
