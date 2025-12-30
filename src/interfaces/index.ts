// Explicitly re-export all interfaces from repositories
export type {
  IProductRepository,
  ProductSearchParams,
  IBundleRepository,
  ICustomerRepository,
  IOrderRepository,
  ICartRepository,
  IInventoryRepository,
  IShippingRepository,
  IAbandonedCartRepository
} from './repositories';

// Explicitly re-export all interfaces from services
export type {
  IAuthService,
  SignUpData,
  IProductService,
  IBundleService,
  ICartService,
  IAbandonedCartService,
  IOrderService,
  CreateOrderData,
  IPaymentService,
  PaymentData,
  PaymentResult,
  SwishPayment,
  KlarnaSession,
  KlarnaOrderData,
  KlarnaOrderLine,
  IShippingService,
  IShippingRateService,
  IShippingLabelService,
  IShipmentTrackingService,
  IAddressValidationService,
  ISwedishShippingService,
  Shipment,
  TrackingInfo,
  TrackingEvent,
  IInventoryService,
  IGDPRService,
  UserData,
  ConsentData,
  UserPreferences
} from './services';

// Explicitly re-export all interfaces from email
export * from './email';

// Explicitly re-export all interfaces from payment
export type {
  IPaymentProcessor,
  IPaymentProcessorRegistry
} from './payment';
