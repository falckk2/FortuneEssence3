import {
  Product,
  Customer,
  Order,
  Cart,
  InventoryItem,
  ShippingRate,
  AbandonedCart,
  AbandonedCartCreateData,
  BundleConfiguration,
  ApiResponse
} from '@/types';

export interface IProductRepository {
  findAll(params?: ProductSearchParams): Promise<ApiResponse<Product[]>>;
  findById(id: string): Promise<ApiResponse<Product>>;
  findByCategory(category: string): Promise<ApiResponse<Product[]>>;
  findBySku(sku: string): Promise<ApiResponse<Product>>;
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
}

export interface IBundleRepository {
  findByProductId(bundleProductId: string): Promise<ApiResponse<BundleConfiguration>>;
  findAll(): Promise<ApiResponse<BundleConfiguration[]>>;
}

export interface ICustomerRepository {
  findById(id: string): Promise<ApiResponse<Customer>>;
  findByEmail(email: string): Promise<ApiResponse<Customer>>;
  create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>>;
  update(id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>>;
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
  findRatesByCountry(country: string): Promise<ApiResponse<ShippingRate[]>>;
  findById(id: string): Promise<ApiResponse<ShippingRate>>;
  calculateShipping(weight: number, country: string): Promise<ApiResponse<ShippingRate>>;
  getFreeShippingThreshold(country: string): Promise<ApiResponse<number | null>>;
  getEstimatedDeliveryDate(shippingRateId: string): Promise<ApiResponse<Date>>;
}

export interface IAbandonedCartRepository {
  create(data: AbandonedCartCreateData): Promise<ApiResponse<AbandonedCart>>;
  update(id: string, data: Partial<AbandonedCart>): Promise<ApiResponse<AbandonedCart>>;
  findByCartId(cartId: string, status?: string): Promise<ApiResponse<AbandonedCart>>;
  findByRecoveryToken(token: string): Promise<ApiResponse<AbandonedCart>>;
  findForReminder(hoursAbandoned: number, maxReminders: number): Promise<ApiResponse<AbandonedCart[]>>;
  markReminded(id: string, newReminderCount: number): Promise<ApiResponse<void>>;
  markRecovered(token: string, orderId: string): Promise<ApiResponse<void>>;
  markExpired(id: string): Promise<ApiResponse<void>>;
}