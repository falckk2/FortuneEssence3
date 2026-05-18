import { IPaymentProcessor } from '$lib/interfaces/payment';
import { PaymentData, PaymentResult } from '$lib/interfaces/services';
import { ApiResponse } from '$lib/types';

/**
 * Bank Transfer Payment Processor
 * Handles bank transfer payments (manual payment method)
 *
 * Follows Open/Closed Principle:
 * - New payment method can be added without modifying existing code
 */
export class BankTransferPaymentProcessor implements IPaymentProcessor {
  getMethod(): string {
    return 'bank-transfer';
  }

  async process(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    const referenceNumber = this.generateReferenceNumber(paymentData.orderId);
    const paymentId = `bt_${crypto.randomUUID()}`;

    return {
      success: true,
      data: {
        paymentId,
        status: 'pending', // Bank transfers are always pending until manually verified
        amount: paymentData.amount,
        currency: paymentData.currency,
        referenceNumber,
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(_paymentId: string): Promise<ApiResponse<boolean>> {
    // TODO: check a database or external system to see if the bank transfer has been received
    // For now, bank transfers are always unverified (must be manually confirmed by admin)
    return {
      success: true,
      data: false,
    };
  }

  /**
   * Generate a unique reference number for the bank transfer
   * This would be displayed to the customer for including in their transfer
   */
  private generateReferenceNumber(orderId: string): string {
    // Simple reference number format: ORDER-{orderId}-{checksum}
    const timestamp = Date.now().toString().slice(-6);
    return `ORDER-${orderId.slice(-8).toUpperCase()}-${timestamp}`;
  }
}
