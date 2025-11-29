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

  // Services
  IProductService: Symbol.for('IProductService'),
  ICartService: Symbol.for('ICartService'),
  IOrderService: Symbol.for('IOrderService'),
  IPaymentService: Symbol.for('IPaymentService'),
  IShippingService: Symbol.for('IShippingService'),
  IInventoryService: Symbol.for('IInventoryService'),
  IAuthService: Symbol.for('IAuthService'),
  IGDPRService: Symbol.for('IGDPRService'),

  // Utilities
  CategoryService: Symbol.for('CategoryService'),
  TaxCalculator: Symbol.for('TaxCalculator'),
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

  container.register(TOKENS.IProductRepository, { useClass: ProductRepository });
  container.register(TOKENS.ICartRepository, { useClass: CartRepository });
  container.register(TOKENS.IOrderRepository, { useClass: OrderRepository });
  container.register(TOKENS.ICustomerRepository, { useClass: CustomerRepository });
  container.register(TOKENS.IInventoryRepository, { useClass: InventoryRepository });
  container.register(TOKENS.IShippingRepository, { useClass: ShippingRepository });

  // Register Services
  const { ProductService } = require('@/services/products/ProductService');
  const { CartService } = require('@/services/cart/CartService');
  const { OrderService } = require('@/services/orders/OrderService');
  const { PaymentService } = require('@/services/payment/PaymentService');
  const { ShippingService } = require('@/services/shipping/ShippingService');
  const { InventoryService } = require('@/services/inventory/InventoryService');
  const { AuthService } = require('@/services/auth/AuthService');
  const { GDPRService } = require('@/services/gdpr/GDPRService');

  container.register(TOKENS.IProductService, { useClass: ProductService });
  container.register(TOKENS.ICartService, { useClass: CartService });
  container.register(TOKENS.IOrderService, { useClass: OrderService });
  container.register(TOKENS.IPaymentService, { useClass: PaymentService });
  container.register(TOKENS.IShippingService, { useClass: ShippingService });
  container.register(TOKENS.IInventoryService, { useClass: InventoryService });
  container.register(TOKENS.IAuthService, { useClass: AuthService });
  container.register(TOKENS.IGDPRService, { useClass: GDPRService });

  // Register Utilities
  const { CategoryService } = require('@/config/categories');
  const { TaxCalculator } = require('@/config/payment.config');

  container.register(TOKENS.CategoryService, { useClass: CategoryService });
  container.register(TOKENS.TaxCalculator, { useClass: TaxCalculator });
}

export { container };
