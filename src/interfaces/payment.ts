import { PaymentData, PaymentResult } from './services';
import { ApiResponse } from '@/types';

/**
 * Payment Processor Interface
 *
 * Strategy Pattern - Each payment method implements this interface
 * This allows adding new payment methods without modifying PaymentService (Open/Closed Principle)
 */
export interface IPaymentProcessor {
  /**
   * Process a payment using this processor's payment method
   * @param paymentData Payment information
   * @returns Payment result with transaction ID and status
   */
  process(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>>;

  /**
   * Verify a payment was successful
   * @param paymentId Payment identifier from the processor
   * @returns True if payment is verified
   */
  verify(paymentId: string): Promise<ApiResponse<boolean>>;

  /**
   * Get the payment method identifier this processor handles
   */
  getMethod(): string;
}

/**
 * Payment Processor Registry
 * Maintains a registry of available payment processors
 */
export interface IPaymentProcessorRegistry {
  register(processor: IPaymentProcessor): void;
  getProcessor(method: string): IPaymentProcessor | undefined;
  getAllProcessors(): IPaymentProcessor[];
}
