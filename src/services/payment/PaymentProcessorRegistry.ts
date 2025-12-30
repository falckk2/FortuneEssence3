import { IPaymentProcessor, IPaymentProcessorRegistry } from '@/interfaces/payment';

/**
 * Payment Processor Registry
 *
 * Manages all available payment processors
 * Follows Open/Closed Principle - can add new processors without modifying this class
 */
export class PaymentProcessorRegistry implements IPaymentProcessorRegistry {
  private processors: Map<string, IPaymentProcessor> = new Map();

  /**
   * Register a payment processor
   * @param processor Payment processor to register
   */
  register(processor: IPaymentProcessor): void {
    const method = processor.getMethod();
    if (this.processors.has(method)) {
      console.warn(`Payment processor for method '${method}' is being overridden`);
    }
    this.processors.set(method, processor);
  }

  /**
   * Get a payment processor for a specific method
   * @param method Payment method (e.g., 'card', 'swish', 'klarna')
   * @returns Payment processor or undefined if not found
   */
  getProcessor(method: string): IPaymentProcessor | undefined {
    return this.processors.get(method);
  }

  /**
   * Get all registered payment processors
   * @returns Array of all registered processors
   */
  getAllProcessors(): IPaymentProcessor[] {
    return Array.from(this.processors.values());
  }

  /**
   * Check if a payment method is supported
   * @param method Payment method to check
   * @returns True if the method is supported
   */
  isSupported(method: string): boolean {
    return this.processors.has(method);
  }

  /**
   * Get all supported payment methods
   * @returns Array of supported payment method identifiers
   */
  getSupportedMethods(): string[] {
    return Array.from(this.processors.keys());
  }
}
