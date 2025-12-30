// Dependency Injection Container
// Following Dependency Inversion Principle - depend on abstractions, not concretions

import 'reflect-metadata';
import { container } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Tokens for dependency injection
export const TOKENS = {
  // Database
  SupabaseClient: Symbol.for('SupabaseClient'),

  // Repositories
  IProductRepository: Symbol.for('IProductRepository'),
  ICustomerRepository: Symbol.for('ICustomerRepository'),
  IOrderRepository: Symbol.for('IOrderRepository'),
  ICartRepository: Symbol.for('ICartRepository'),
  IInventoryRepository: Symbol.for('IInventoryRepository'),
  IShippingRepository: Symbol.for('IShippingRepository'),
  IAbandonedCartRepository: Symbol.for('IAbandonedCartRepository'),
  IBundleRepository: Symbol.for('IBundleRepository'),
  IWishlistRepository: Symbol.for('IWishlistRepository'),

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

// Configuration function to register all dependencies
export function configureDependencyInjection() {
  // Register database client
  container.register(TOKENS.SupabaseClient, {
    useValue: supabase,
  });

  // Register Repositories
  const { ProductRepository } = require('@/repositories/products/ProductRepository');
  const { CartRepository } = require('@/repositories/cart/CartRepository');
  const { OrderRepository } = require('@/repositories/orders/OrderRepository');
  const { CustomerRepository } = require('@/repositories/customers/CustomerRepository');
  const { InventoryRepository } = require('@/repositories/inventory/InventoryRepository');
  const { ShippingRepository } = require('@/repositories/shipping/ShippingRepository');
  const { AbandonedCartRepository } = require('@/repositories/cart/AbandonedCartRepository');
  const { BundleRepository } = require('@/repositories/bundles/BundleRepository');
  const { WishlistRepository } = require('@/repositories/wishlist/WishlistRepository');

  container.register(TOKENS.IProductRepository, { useClass: ProductRepository });
  container.register(TOKENS.ICartRepository, { useClass: CartRepository });
  container.register(TOKENS.IOrderRepository, { useClass: OrderRepository });
  container.register(TOKENS.ICustomerRepository, { useClass: CustomerRepository });
  container.register(TOKENS.IInventoryRepository, { useClass: InventoryRepository });
  container.register(TOKENS.IShippingRepository, { useClass: ShippingRepository });
  container.register(TOKENS.IAbandonedCartRepository, { useClass: AbandonedCartRepository });
  container.register(TOKENS.IBundleRepository, { useClass: BundleRepository });
  container.register(TOKENS.IWishlistRepository, { useClass: WishlistRepository });

  // Register Services
  const { ProductService } = require('@/services/products/ProductService');
  const { CartService } = require('@/services/cart/CartService');
  const { OrderService } = require('@/services/orders/OrderService');
  const { PaymentService } = require('@/services/payment/PaymentService');
  const { ShippingService } = require('@/services/shipping/ShippingService');
  const { InventoryService } = require('@/services/inventory/InventoryService');
  const { AuthService } = require('@/services/auth/AuthService');
  const { GDPRService } = require('@/services/gdpr/GDPRService');
  const { EmailService } = require('@/services/email/EmailService');
  const { BundleService } = require('@/services/bundles/BundleService');

  container.register(TOKENS.IProductService, { useClass: ProductService });
  container.register(TOKENS.ICartService, { useClass: CartService });
  container.register(TOKENS.IOrderService, { useClass: OrderService });
  container.register(TOKENS.IPaymentService, { useClass: PaymentService });
  container.register(TOKENS.IShippingService, { useClass: ShippingService });
  container.register(TOKENS.IInventoryService, { useClass: InventoryService });
  container.register(TOKENS.IAuthService, { useClass: AuthService });
  container.register(TOKENS.IGDPRService, { useClass: GDPRService });
  container.register(TOKENS.IEmailService, { useClass: EmailService });
  container.register(TOKENS.IBundleService, { useClass: BundleService });

  // Register Utilities
  const { CategoryService } = require('@/config/categories');
  const { TaxCalculator } = require('@/config/payment.config');
  const { CarrierRulesEngine } = require('@/services/shipping/CarrierRulesEngine');
  const { LabelGenerationService } = require('@/services/shipping/LabelGenerationService');

  container.register(TOKENS.CategoryService, { useClass: CategoryService });
  container.register(TOKENS.TaxCalculator, { useClass: TaxCalculator });
  container.register(TOKENS.CarrierRulesEngine, { useClass: CarrierRulesEngine });
  container.register(TOKENS.LabelGenerationService, { useClass: LabelGenerationService });

  // Register Test Services (Following SOLID principles)
  const { TestCheckoutService } = require('@/services/test/TestCheckoutService');
  const { ShipmentSimulationService } = require('@/services/test/ShipmentSimulationService');
  const { createDefaultStatusProgressionStrategy } = require('@/services/test/StatusProgressionStrategy');
  const { createTestOrderValidationPipeline } = require('@/services/test/ValidationPipeline');

  // Register strategy and validation pipeline as singletons
  container.register(TOKENS.IStatusProgressionStrategy, {
    useValue: createDefaultStatusProgressionStrategy(),
  });

  container.register(TOKENS.ITestOrderValidationPipeline, {
    useValue: createTestOrderValidationPipeline(),
  });

  // Register test services with dependency injection
  container.register(TOKENS.ITestCheckoutService, {
    useFactory: (c) => {
      return new TestCheckoutService(
        c.resolve(TOKENS.ICartService),
        c.resolve(TOKENS.IShippingService),
        c.resolve(TOKENS.IInventoryService),
        c.resolve(TOKENS.IProductService),
        c.resolve(TOKENS.IOrderRepository),
        c.resolve(TOKENS.IEmailService),
        c.resolve(TOKENS.ITestOrderValidationPipeline)
      );
    },
  });

  container.register(TOKENS.IShipmentSimulationService, {
    useFactory: (c) => {
      return new ShipmentSimulationService(
        c.resolve(TOKENS.IOrderRepository),
        c.resolve(TOKENS.IShippingService),
        c.resolve(TOKENS.IStatusProgressionStrategy)
      );
    },
  });
}

export { container };
