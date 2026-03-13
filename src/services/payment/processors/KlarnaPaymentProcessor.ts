import { IPaymentProcessor } from '@/interfaces/payment';
import { PaymentData, PaymentResult } from '@/interfaces/services';
import { ApiResponse } from '@/types';

/**
 * Klarna Payment Processor
 * Handles Klarna payments (Buy now, pay later)
 *
 * Follows Open/Closed Principle:
 * - New payment method can be added without modifying existing code
 */
export class KlarnaPaymentProcessor implements IPaymentProcessor {
  getMethod(): string {
    return 'klarna';
  }

  async process(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>> {
    try {
      // TODO: Integrate with actual Klarna API
      // This is a placeholder implementation
      const mockPaymentId = `klarna_${crypto.randomUUID()}`;

      // Simulate Klarna payment
      await this.simulateKlarnaPayment(paymentData);

      return {
        success: true,
        data: {
          paymentId: mockPaymentId,
          status: 'succeeded',
          amount: paymentData.amount,
          currency: paymentData.currency,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Klarna payment failed: ${error}`,
      };
    }
  }

  async verify(paymentId: string): Promise<ApiResponse<boolean>> {
    // TODO: Verify with actual Klarna API
    // For now, simulate verification by checking the paymentId prefix
    return {
      success: true,
      data: paymentId.startsWith('klarna_'),
    };
  }

  private async simulateKlarnaPayment(paymentData: PaymentData): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Basic validation
    if (paymentData.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    if (!paymentData.customerId) {
      throw new Error('Customer ID is required for Klarna payments');
    }
  }
}
