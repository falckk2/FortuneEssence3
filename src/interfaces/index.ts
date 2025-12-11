// Explicitly re-export all interfaces from repositories
export type {
  IProductRepository,
  ProductSearchParams,
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
  ICartService,
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
