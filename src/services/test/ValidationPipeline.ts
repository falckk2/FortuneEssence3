import { IValidator, IValidationPipeline, ValidationResult, TestOrderDTO } from '@/interfaces/test';

/**
 * Validation Pipeline - Open/Closed Principle
 * Open for extension (add new validators), closed for modification
 */
export class ValidationPipeline<T> implements IValidationPipeline<T> {
  private validators: IValidator<T>[] = [];

  constructor(validators: IValidator<T>[] = []) {
    this.validators = validators;
  }

  addValidator(validator: IValidator<T>): void {
    this.validators.push(validator);
  }

  validate(data: T): ValidationResult {
    const errors: string[] = [];

    for (const validator of this.validators) {
      const result = validator.validate(data);
      if (!result.valid) {
        if (result.error) {
          errors.push(result.error);
        }
        if (result.errors) {
          errors.push(...result.errors);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      error: errors.length > 0 ? errors[0] : undefined,
    };
  }
}

/**
 * Shipping Rate Validator
 */
export class ShippingRateValidator implements IValidator<TestOrderDTO> {
  validate(data: TestOrderDTO): ValidationResult {
    // In test mode, we auto-inject if missing, so this is just a warning
    if (!data.shippingRateId) {
      console.log('🧪 TEST MODE: Shipping rate ID will be auto-generated');
    }
    return { valid: true };
  }
}

/**
 * Customer ID Validator
 */
export class CustomerIdValidator implements IValidator<TestOrderDTO> {
  validate(data: TestOrderDTO): ValidationResult {
    if (!data.customerId || data.customerId.trim() === '') {
      return {
        valid: false,
        error: 'Customer ID is required. Please sign in or provide a valid customer UUID.',
      };
    }

    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.customerId)) {
      return {
        valid: false,
        error: 'Customer ID must be a valid UUID format.',
      };
    }

    return { valid: true };
  }
}

/**
 * Price Validator
 */
export class PriceValidator implements IValidator<TestOrderDTO> {
  validate(data: TestOrderDTO): ValidationResult {
    const errors: string[] = [];

    for (const item of data.items) {
      if (!item.price || item.price <= 0) {
        errors.push(`Invalid price for product ${item.productId}. Price must be greater than 0.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      error: errors.length > 0 ? errors[0] : undefined,
    };
  }
}

/**
 * Address Validator
 */
export class AddressValidator implements IValidator<TestOrderDTO> {
  validate(data: TestOrderDTO): ValidationResult {
    const errors: string[] = [];

    if (!data.shippingAddress) {
      errors.push('Shipping address is required.');
    } else {
      if (!data.shippingAddress.street) errors.push('Shipping street is required.');
      if (!data.shippingAddress.city) errors.push('Shipping city is required.');
      if (!data.shippingAddress.postalCode) errors.push('Shipping postal code is required.');
      if (!data.shippingAddress.country) errors.push('Shipping country is required.');
    }

    if (!data.billingAddress) {
      errors.push('Billing address is required.');
    } else {
      if (!data.billingAddress.street) errors.push('Billing street is required.');
      if (!data.billingAddress.city) errors.push('Billing city is required.');
      if (!data.billingAddress.postalCode) errors.push('Billing postal code is required.');
      if (!data.billingAddress.country) errors.push('Billing country is required.');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      error: errors.length > 0 ? errors[0] : undefined,
    };
  }
}

/**
 * Items Validator
 */
export class ItemsValidator implements IValidator<TestOrderDTO> {
  validate(data: TestOrderDTO): ValidationResult {
    if (!data.items || data.items.length === 0) {
      return {
        valid: false,
        error: 'Order must have at least one item.',
      };
    }

    const errors: string[] = [];
    for (const item of data.items) {
      if (!item.productId) {
        errors.push('Product ID is required for all items.');
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Invalid quantity for product ${item.productId}.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      error: errors.length > 0 ? errors[0] : undefined,
    };
  }
}

/**
 * Factory function to create a test order validation pipeline
 */
export function createTestOrderValidationPipeline(): IValidationPipeline<TestOrderDTO> {
  return new ValidationPipeline<TestOrderDTO>([
    new CustomerIdValidator(),
    new ItemsValidator(),
    new PriceValidator(),
    new AddressValidator(),
    new ShippingRateValidator(),
  ]);
}
