// Payment Provider Interface
// Following Open/Closed Principle - new payment providers can be added without modifying existing code

import { PaymentMethod, ApiResponse } from '@/types';

export interface PaymentData {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  redirectUrl?: string;
  qrCode?: string;
  deepLink?: string;
}

export interface IPaymentProvider {
  readonly name: string;
  readonly supportedCurrencies: string[];
  readonly supportedCountries: string[];

  processPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>>;
  verifyPayment(paymentId: string): Promise<ApiResponse<boolean>>;
  refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<void>>;
  cancelPayment(paymentId: string): Promise<ApiResponse<void>>;
}

export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly name: string;
  abstract readonly supportedCurrencies: string[];
  abstract readonly supportedCountries: string[];

  abstract processPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>>;
  abstract verifyPayment(paymentId: string): Promise<ApiResponse<boolean>>;

  async refundPayment(paymentId: string, amount?: number): Promise<ApiResponse<void>> {
    return {
      success: false,
      error: 'Refund not implemented for this provider',
    };
  }

  async cancelPayment(paymentId: string): Promise<ApiResponse<void>> {
    return {
      success: false,
      error: 'Cancel not implemented for this provider',
    };
  }

  protected validatePaymentData(paymentData: PaymentData): string | null {
    if (paymentData.amount <= 0) {
      return 'Amount must be greater than 0';
    }

    if (!this.supportedCurrencies.includes(paymentData.currency)) {
      return `Currency ${paymentData.currency} not supported. Supported currencies: ${this.supportedCurrencies.join(', ')}`;
    }

    return null;
  }
}
