// Dependency Injection Container
// Following Dependency Inversion Principle - depend on abstractions, not concretions
/* eslint-disable @typescript-eslint/no-explicit-any */

import 'reflect-metadata';
import { container } from 'tsyringe';
import Stripe from 'stripe';
import { supabase } from '$lib/supabase';
import { getSupabaseServer } from '$lib/supabase-server';
import { config } from '$lib/config';
import { TOKENS } from '$lib/config/di-tokens';

// Re-export TOKENS so existing callers (`import { TOKENS } from '$lib/config/di-container'`) keep working.
export { TOKENS } from '$lib/config/di-tokens';

// Repositories
import { ProductRepository } from '$lib/repositories/products/ProductRepository';
import { CartRepository } from '$lib/repositories/cart/CartRepository';
import { OrderRepository } from '$lib/repositories/orders/OrderRepository';
import { OrderItemRepository } from '$lib/repositories/orders/OrderItemRepository';
import { CustomerRepository } from '$lib/repositories/customers/CustomerRepository';
import { InventoryRepository } from '$lib/repositories/inventory/InventoryRepository';
import { ShippingRepository } from '$lib/repositories/shipping/ShippingRepository';
import { AbandonedCartRepository } from '$lib/repositories/cart/AbandonedCartRepository';
import { BundleRepository } from '$lib/repositories/bundles/BundleRepository';
import { WishlistRepository } from '$lib/repositories/wishlist/WishlistRepository';
import { ReturnRepository } from '$lib/repositories/returns/ReturnRepository';
import { AnalyticsRepository } from '$lib/repositories/analytics/AnalyticsRepository';

// Services
import { ProductService } from '$lib/services/products/ProductService';
import { CartService } from '$lib/services/cart/CartService';
import { OrderService } from '$lib/services/orders/OrderService';
import { PaymentService } from '$lib/services/payment/PaymentService';
import { ShippingService } from '$lib/services/shipping/ShippingService';
import { InventoryService } from '$lib/services/inventory/InventoryService';
import { AuthService } from '$lib/services/auth/AuthService';
import { GDPRService } from '$lib/services/gdpr/GDPRService';
import { EmailService } from '$lib/services/email/EmailService';
import { BundleService } from '$lib/services/bundles/BundleService';
import { AnalyticsService } from '$lib/services/analytics/AnalyticsService';
import { ReturnService } from '$lib/services/returns/ReturnService';

// Utilities
import { CategoryService } from '$lib/config/categories';
import { TaxCalculator } from '$lib/config/payment.config';
import { CarrierRulesEngine } from '$lib/services/shipping/CarrierRulesEngine';
import { LabelGenerationService } from '$lib/services/shipping/LabelGenerationService';

// Test Services
import { TestCheckoutService } from '$lib/services/test/TestCheckoutService';
import { ShipmentSimulationService } from '$lib/services/test/ShipmentSimulationService';
import { createDefaultStatusProgressionStrategy } from '$lib/services/test/StatusProgressionStrategy';
import { createTestOrderValidationPipeline } from '$lib/services/test/ValidationPipeline';

export function configureDependencyInjection() {
  container.register(TOKENS.SupabaseClient, { useValue: supabase });
  container.register(TOKENS.SupabaseServerClient, { useValue: getSupabaseServer() });

  container.register(TOKENS.Stripe, {
    useValue: new Stripe(config.payments.stripe.secretKey || 'sk_test_placeholder', {
      apiVersion: '2025-08-27.basil',
    }),
  });

  // Repositories
  container.register(TOKENS.IProductRepository, { useClass: ProductRepository });
  container.register(TOKENS.ICartRepository, { useClass: CartRepository });
  container.register(TOKENS.IOrderRepository, { useClass: OrderRepository });
  container.register(TOKENS.IOrderItemRepository, { useClass: OrderItemRepository });
  container.register(TOKENS.ICustomerRepository, { useClass: CustomerRepository });
  container.register(TOKENS.IInventoryRepository, { useClass: InventoryRepository });
  container.register(TOKENS.IShippingRepository, { useClass: ShippingRepository });
  container.register(TOKENS.IAbandonedCartRepository, { useClass: AbandonedCartRepository });
  container.register(TOKENS.IBundleRepository, { useClass: BundleRepository });
  container.register(TOKENS.IWishlistRepository, { useClass: WishlistRepository });
  container.register(TOKENS.IReturnRepository, { useClass: ReturnRepository });
  container.register(TOKENS.IAnalyticsRepository, { useClass: AnalyticsRepository });

  // Services
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
  container.register(TOKENS.IAnalyticsService, { useClass: AnalyticsService });

  container.register(TOKENS.IReturnService, {
    useFactory: (c: any) => new ReturnService(
      c.resolve(TOKENS.IReturnRepository),
      c.resolve(TOKENS.IOrderRepository),
      c.resolve(TOKENS.IPaymentService)
    ),
  });

  // Utilities
  container.register(TOKENS.CategoryService, { useClass: CategoryService });
  container.register(TOKENS.TaxCalculator, { useClass: TaxCalculator });
  container.register(TOKENS.CarrierRulesEngine, { useClass: CarrierRulesEngine });
  container.register(TOKENS.LabelGenerationService, { useClass: LabelGenerationService });

  // Test Services
  container.register(TOKENS.IStatusProgressionStrategy, {
    useValue: createDefaultStatusProgressionStrategy(),
  });
  container.register(TOKENS.ITestOrderValidationPipeline, {
    useValue: createTestOrderValidationPipeline(),
  });

  container.register(TOKENS.ITestCheckoutService, {
    useFactory: (c) => new TestCheckoutService(
      c.resolve(TOKENS.ICartService),
      c.resolve(TOKENS.IShippingService),
      c.resolve(TOKENS.IInventoryService),
      c.resolve(TOKENS.IProductService),
      c.resolve(TOKENS.IOrderRepository),
      c.resolve(TOKENS.IEmailService),
      c.resolve(TOKENS.ITestOrderValidationPipeline)
    ),
  });

  container.register(TOKENS.IShipmentSimulationService, {
    useFactory: (c) => new ShipmentSimulationService(
      c.resolve(TOKENS.IOrderRepository),
      c.resolve(TOKENS.IShippingService),
      c.resolve(TOKENS.IStatusProgressionStrategy)
    ),
  });
}

// Wrap resolve to return null instead of throwing when token is unregistered.
// Prevents crashes when route files resolve services at module scope before DI is initialised.
const _resolve = container.resolve.bind(container);
(container as any).resolve = function <T>(token: any): T {
  try {
    return _resolve<T>(token);
  } catch {
    return null as T;
  }
};

export { container };
