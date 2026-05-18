import {
  Product,
  Customer,
  Order,
  Cart,
  InventoryItem,
  ShippingRate,
  ShippingLabel,
  CarrierPricingRule,
  AbandonedCart,
  AbandonedCartCreateData,
  BundleConfiguration,
  OrderItem,
  ApiResponse
} from '@/types';

export interface IProductRepository {
  findAll(params?: ProductSearchParams): Promise<ApiResponse<Product[]>>;
  findById(id: string): Promise<ApiResponse<Product>>;
  findByIds(ids: string[]): Promise<ApiResponse<Product[]>>;
  findByCategory(category: string): Promise<ApiResponse<Product[]>>;
  findBySku(sku: string): Promise<ApiResponse<Product>>;
  findBySkus(skus: string[]): Promise<ApiResponse<Product[]>>;
  findFeatured(limit?: number): Promise<ApiResponse<Product[]>>;
  getCategories(): Promise<ApiResponse<Array<{ category: string; count: number }>>>;
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>>;
  update(id: string, product: Partial<Product>): Promise<ApiResponse<Product>>;
  delete(id: string): Promise<ApiResponse<void>>;
}

export interface ProductSearchParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  locale?: string;
  sortBy?: 'name' | 'price' | 'created';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  excludeId?: string;
}

export interface IBundleRepository {
  findByProductId(bundleProductId: string): Promise<ApiResponse<BundleConfiguration>>;
  findAll(): Promise<ApiResponse<BundleConfiguration[]>>;
  create(config: Omit<BundleConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<BundleConfiguration>>;
  update(id: string, data: Partial<Omit<BundleConfiguration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<BundleConfiguration>>;
  delete(id: string): Promise<ApiResponse<void>>;
}

export interface CustomerSearchParams {
  search?: string;
  status?: string;
  limit?: number;
}

export interface ICustomerRepository {
  findAll(params?: CustomerSearchParams): Promise<ApiResponse<Customer[]>>;
  findById(id: string): Promise<ApiResponse<Customer>>;
  findByEmail(email: string): Promise<ApiResponse<Customer>>;
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>>;
  createWithPassword(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, password: string): Promise<ApiResponse<Customer>>;
  update(id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>>;
  changePassword(id: string, currentPassword: string, newPassword: string): Promise<ApiResponse<void>>;
  delete(id: string): Promise<ApiResponse<void>>;
}

export interface IOrderRepository {
  findAll(customerId?: string): Promise<ApiResponse<Order[]>>;
  findById(id: string): Promise<ApiResponse<Order>>;
  findByCustomerId(customerId: string): Promise<ApiResponse<Order[]>>;
  findByStatus(status: string): Promise<ApiResponse<Order[]>>;
  findByTrackingNumber(trackingNumber: string): Promise<ApiResponse<Order>>;
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Order>>;
  update(id: string, order: Partial<Order>): Promise<ApiResponse<Order>>;
  updateStatus(orderId: string, status: string, trackingNumber?: string): Promise<ApiResponse<Order>>;
  getOrderStatistics(customerId?: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }>>;
  getRecentOrders(days: number, limit: number): Promise<ApiResponse<Order[]>>;
}

export interface ICartRepository {
  findById(id: string): Promise<ApiResponse<Cart>>;
  findByUserId(userId: string): Promise<ApiResponse<Cart>>;
  findBySessionId(sessionId: string): Promise<ApiResponse<Cart>>;
  create(cart: Omit<Cart, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Cart>>;
  update(id: string, cart: Partial<Cart>): Promise<ApiResponse<Cart>>;
  delete(id: string): Promise<ApiResponse<void>>;
  mergeGuestCartToUser(sessionId: string, userId: string): Promise<ApiResponse<Cart>>;
}

export interface IInventoryRepository {
  findByProductId(productId: string): Promise<ApiResponse<InventoryItem>>;
  updateStock(productId: string, quantity: number): Promise<ApiResponse<InventoryItem>>;
  reserveStock(productId: string, quantity: number): Promise<ApiResponse<boolean>>;
  releaseReservedStock(productId: string, quantity: number): Promise<ApiResponse<boolean>>;
}

export interface IShippingRepository {
  // Shipping rates methods
  findRatesByCountry(country: string): Promise<ApiResponse<ShippingRate[]>>;
  findById(id: string): Promise<ApiResponse<ShippingRate>>;
  findRatesByCarrier(carrierCode: string): Promise<ApiResponse<ShippingRate[]>>;
  calculateShipping(weight: number, country: string): Promise<ApiResponse<ShippingRate>>;
  create(shippingRate: Omit<ShippingRate, 'id'>): Promise<ApiResponse<ShippingRate>>;
  update(id: string, shippingRate: Partial<ShippingRate>): Promise<ApiResponse<ShippingRate>>;
  delete(id: string): Promise<ApiResponse<void>>;

  // Utility methods
  getFreeShippingThreshold(country: string): Promise<ApiResponse<number | null>>;
  getEstimatedDeliveryDate(shippingRateId: string): Promise<ApiResponse<Date>>;
  getAllCountries(): Promise<ApiResponse<string[]>>;
  validateShippingToAddress(country: string, weight: number): Promise<ApiResponse<boolean>>;

  // Shipping labels methods
  saveShippingLabel(label: Omit<ShippingLabel, 'id' | 'generatedAt'>): Promise<ApiResponse<ShippingLabel>>;
  findLabelByOrderId(orderId: string): Promise<ApiResponse<ShippingLabel>>;
  findLabelByTrackingNumber(trackingNumber: string): Promise<ApiResponse<ShippingLabel>>;

  // Pricing rules methods
  findPricingRule(
    carrierCode: string,
    serviceType: string,
    country: string,
    weight: number,
    postalCode?: string
  ): Promise<ApiResponse<CarrierPricingRule>>;
}

import type { Return, ReturnStatus, ReturnFilters, CreateReturnItemData } from '@/types/returns';

export interface IReturnRepository {
  create(
    returnData: Omit<Return, 'id' | 'items' | 'createdAt' | 'updatedAt'>,
    items: CreateReturnItemData[]
  ): Promise<ApiResponse<Return>>;
  findById(id: string): Promise<ApiResponse<Return>>;
  findByOrderId(orderId: string): Promise<ApiResponse<Return[]>>;
  findAll(filters?: ReturnFilters): Promise<ApiResponse<Return[]>>;
  updateStatus(id: string, status: ReturnStatus, additionalData?: Partial<Return>): Promise<ApiResponse<Return>>;
  update(id: string, data: Partial<Return>): Promise<ApiResponse<Return>>;
  getStatusCounts(): Promise<ApiResponse<Record<string, number>>>;
  findOrphanedReturns(): Promise<ApiResponse<{ id: string; createdAt: Date }[]>>;
  deleteOrphanedReturns(): Promise<ApiResponse<{ deleted: number }>>;
}

export interface IOrderItemRepository {
  createMany(orderId: string, items: OrderItem[]): Promise<ApiResponse<void>>;
  findByOrderId(orderId: string): Promise<ApiResponse<OrderItem[]>>;
  findByProductId(productId: string, startDate?: Date, endDate?: Date): Promise<ApiResponse<OrderItem[]>>;
}

export interface IAnalyticsRepository {
  getOrdersInRange(startDate: Date, endDate: Date): Promise<ApiResponse<Order[]>>;
  getOrderItemsInRange(startDate: Date, endDate: Date): Promise<ApiResponse<Array<{
    productId: string;
    productName: string;
    category: string;
    quantity: number;
    price: number;
  }>>>;
  getCustomerCountInRange(startDate: Date, endDate: Date): Promise<ApiResponse<number>>;
  getTotalCustomerCount(): Promise<ApiResponse<number>>;
}

export interface IAbandonedCartRepository {
  create(data: AbandonedCartCreateData): Promise<ApiResponse<AbandonedCart>>;
  update(id: string, data: Partial<AbandonedCart>): Promise<ApiResponse<AbandonedCart>>;
  findById(id: string): Promise<ApiResponse<AbandonedCart>>;
  findByCartId(cartId: string, status?: string): Promise<ApiResponse<AbandonedCart>>;
  findByRecoveryToken(token: string): Promise<ApiResponse<AbandonedCart>>;
  findForReminder(hoursAbandoned: number, maxReminders: number): Promise<ApiResponse<AbandonedCart[]>>;
  markReminded(id: string, newReminderCount: number): Promise<ApiResponse<void>>;
  markRecovered(token: string, orderId: string): Promise<ApiResponse<void>>;
  markExpired(id: string): Promise<ApiResponse<void>>;
}
