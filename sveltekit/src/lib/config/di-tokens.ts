// Injection tokens — kept in a standalone file so services can import tokens
// without creating a circular dependency with di-container.ts (which imports the services).
export const TOKENS = {
  // Database
  SupabaseClient: Symbol.for('SupabaseClient'),
  SupabaseServerClient: Symbol.for('SupabaseServerClient'),
  Stripe: Symbol.for('Stripe'),

  // Repositories
  IProductRepository: Symbol.for('IProductRepository'),
  ICustomerRepository: Symbol.for('ICustomerRepository'),
  IOrderRepository: Symbol.for('IOrderRepository'),
  IOrderItemRepository: Symbol.for('IOrderItemRepository'),
  ICartRepository: Symbol.for('ICartRepository'),
  IInventoryRepository: Symbol.for('IInventoryRepository'),
  IShippingRepository: Symbol.for('IShippingRepository'),
  IAbandonedCartRepository: Symbol.for('IAbandonedCartRepository'),
  IBundleRepository: Symbol.for('IBundleRepository'),
  IWishlistRepository: Symbol.for('IWishlistRepository'),
  IReturnRepository: Symbol.for('IReturnRepository'),
  IAnalyticsRepository: Symbol.for('IAnalyticsRepository'),

  // Services
  IProductService: Symbol.for('IProductService'),
  ICartService: Symbol.for('ICartService'),
  IOrderService: Symbol.for('IOrderService'),
  IPaymentService: Symbol.for('IPaymentService'),
  IShippingService: Symbol.for('IShippingService'),
  IInventoryService: Symbol.for('IInventoryService'),
  IAuthService: Symbol.for('IAuthService'),
  IGDPRService: Symbol.for('IGDPRService'),
  IEmailService: Symbol.for('IEmailService'),
  IBundleService: Symbol.for('IBundleService'),
  IReturnService: Symbol.for('IReturnService'),
  IAnalyticsService: Symbol.for('IAnalyticsService'),

  // Test Services
  ITestCheckoutService: Symbol.for('ITestCheckoutService'),
  IShipmentSimulationService: Symbol.for('IShipmentSimulationService'),
  IStatusProgressionStrategy: Symbol.for('IStatusProgressionStrategy'),
  ITestOrderValidationPipeline: Symbol.for('ITestOrderValidationPipeline'),

  // Utilities
  CategoryService: Symbol.for('CategoryService'),
  TaxCalculator: Symbol.for('TaxCalculator'),
  CarrierRulesEngine: Symbol.for('CarrierRulesEngine'),
  LabelGenerationService: Symbol.for('LabelGenerationService'),
};
