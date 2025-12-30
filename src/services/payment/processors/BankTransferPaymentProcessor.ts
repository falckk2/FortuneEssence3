import { IPaymentProcessor } from '@/interfaces/payment';
import { PaymentData, PaymentResult } from '@/interfaces/services';
import { ApiResponse } from '@/types';

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
    try {
      // Generate a reference number for the bank transfer
      const referenceNumber = this.generateReferenceNumber(paymentData.orderId);
      const paymentId = `bt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return {
        success: true,
        data: {
          paymentId: paymentId,
          status: 'pending', // Bank transfers are always pending until manually verified
          amount: paymentData.amount,
          currency: paymentData.currency,
          referenceNumber,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Bank transfer payment failed: ${error}`,
      };
    }
  }

  async verify(paymentId: string): Promise<ApiResponse<boolean>> {
    try {
      // TODO: In a real implementation, this would check a database or external system
      // to see if the bank transfer has been received
      // For now, bank transfers are always unverified (must be manually confirmed)
      return {
        success: true,
        data: false, // Always false until manually confirmed by admin
      };
    } catch (error) {
      return {
        success: false,
        error: `Bank transfer verification failed: ${error}`,
      };
    }
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
