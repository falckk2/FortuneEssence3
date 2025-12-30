import { ApiResponse } from '@/types';

/**
 * Test Order Data Transfer Object
 */
export interface TestOrderDTO {
  customerId: string;
  email?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    firstName?: string;
    lastName?: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    firstName?: string;
    lastName?: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: 'swish' | 'klarna' | 'card' | 'bank-transfer';
  shippingRateId?: string;
}

/**
 * Test Order Result
 */
export interface TestOrderResult {
  order: {
    id: string;
    customerId: string;
    items: any[];
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    paymentId: string;
    paymentStatus: string;
    shippingAddress: any;
    billingAddress: any;
    paymentMethod: string;
    carrier?: string;
  };
  payment: {
    paymentId: string;
    status: string;
    testMode: boolean;
    message: string;
  };
  shippingLabel: {
    trackingNumber: string;
    carrierCode: string;
    labelUrl: string;
  } | null;
  message: string;
}

/**
 * Shipment Simulation Result
 */
export interface ShipmentSimulationResult {
  orderId: string;
  previousStatus?: string;
  currentStatus: string;
  order?: any;
  progression?: Array<{
    status: string;
    timestamp: string;
    success: boolean;
    error?: string;
  }>;
  message: string;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errors?: string[];
}

/**
 * Test Checkout Service Interface
 */
export interface ITestCheckoutService {
  processTestCheckout(orderData: TestOrderDTO): Promise<ApiResponse<TestOrderResult>>;
}

/**
 * Status Progression Strategy Interface
 */
export interface IStatusProgressionStrategy {
  getNextStatus(currentStatus: string): string | null;
  canProgress(currentStatus: string): boolean;
  getAllStatuses(): string[];
}

/**
 * Shipment Simulation Service Interface
 */
export interface IShipmentSimulationService {
  progressToNextStatus(orderId: string): Promise<ApiResponse<ShipmentSimulationResult>>;
  setOrderStatus(orderId: string, status: string): Promise<ApiResponse<ShipmentSimulationResult>>;
  simulateCompleteDelivery(orderId: string): Promise<ApiResponse<ShipmentSimulationResult>>;
  generateTrackingEvents(orderId: string): Promise<ApiResponse<any>>;
}

/**
 * Generic Validator Interface
 */
export interface IValidator<T> {
  validate(data: T): ValidationResult;
}

/**
 * Validation Pipeline Interface
 */
export interface IValidationPipeline<T> {
  validate(data: T): ValidationResult;
  addValidator(validator: IValidator<T>): void;
}
