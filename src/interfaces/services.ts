import {
  Product,
  Customer,
  Order,
  Cart,
  CartItem,
  PaymentMethod,
  ShippingRate,
  Address,
  BundleConfiguration,
  ApiResponse,
  ShippingLabel,
  CarrierInfo
} from '@/types';
import { BundleValidationResult } from '@/types/bundles';

export interface IAuthService {
  signIn(email: string, password: string): Promise<ApiResponse<{ user: Customer; token: string }>>;
  signUp(userData: SignUpData): Promise<ApiResponse<Customer>>;
  signOut(): Promise<ApiResponse<void>>;
  getCurrentUser(): Promise<ApiResponse<Customer>>;
  resetPassword(email: string): Promise<ApiResponse<void>>;
  verifyResetToken(token: string): Promise<ApiResponse<{ email: string }>>;
  completePasswordReset(token: string, newPassword: string): Promise<ApiResponse<void>>;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  marketingOptIn: boolean;
}

export interface IProductService {
  getProducts(params?: ProductSearchParams): Promise<ApiResponse<Product[]>>;
  getProduct(id: string): Promise<ApiResponse<Product>>;
  searchProducts(query: string, locale: string): Promise<ApiResponse<Product[]>>;
  getProductsByCategory(category: string): Promise<ApiResponse<Product[]>>;
  getFeaturedProducts(): Promise<ApiResponse<Product[]>>;
  getProductWithLocalization(id: string, locale: string): Promise<ApiResponse<Product>>;
  getProductCategories(): Promise<ApiResponse<Array<{ category: string; count: number; displayName: { sv: string; en: string } }>>>;
}

export interface ProductSearchParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  locale?: string;
}

export interface IBundleService {
  getBundleConfiguration(bundleProductId: string): Promise<ApiResponse<BundleConfiguration>>;
  getAllBundleConfigurations(): Promise<ApiResponse<BundleConfiguration[]>>;
  getEligibleProducts(bundleProductId: string): Promise<ApiResponse<Product[]>>;
  validateBundleSelection(
    bundleProductId: string,
    selectedProductIds: string[],
    quantities?: { [productId: string]: number }
  ): Promise<ApiResponse<BundleValidationResult>>;
  calculateBundlePrice(
    bundleProductId: string,
    selectedProductIds: string[]
  ): Promise<ApiResponse<{ bundlePrice: number; individualTotal: number; savings: number }>>;
}

/**
 * Abandoned Cart Service - Handles abandoned cart tracking and recovery
 * Single Responsibility: Manage abandoned cart recovery lifecycle
 */
export interface IAbandonedCartService {
  trackAbandonedCart(
    cartId: string,
    email: string,
    customerId?: string,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApiResponse<{ abandonedCartId: string; recoveryToken: string }>>;
  getAbandonedCartsForReminder(hoursAbandoned?: number, maxReminders?: number): Promise<ApiResponse<any[]>>;
  markCartReminded(abandonedCartId: string): Promise<ApiResponse<void>>;
  markCartRecovered(recoveryToken: string, orderId: string): Promise<ApiResponse<void>>;
  recoverAbandonedCart(recoveryToken: string): Promise<ApiResponse<{
    cartId: string;
    items: CartItem[];
    total: number;
    email: string;
  }>>;
}

/**
 * Cart Service - Handles shopping cart operations
 * Single Responsibility: Manage shopping cart CRUD operations
 *
 * Note: Extends IAbandonedCartService for backward compatibility
 * In new code, use IAbandonedCartService separately for abandoned cart operations
 */
export interface ICartService extends IAbandonedCartService {
  getCart(userId?: string, sessionId?: string): Promise<ApiResponse<Cart>>;
  addItem(cartId: string, item: CartItem): Promise<ApiResponse<Cart>>;
  addBundleToCart(
    cartId: string,
    bundleProductId: string,
    selectedProductIds: string[],
    quantity?: number
  ): Promise<ApiResponse<Cart>>;
  removeItem(cartId: string, productId: string): Promise<ApiResponse<Cart>>;
  updateQuantity(cartId: string, productId: string, quantity: number): Promise<ApiResponse<Cart>>;
  clearCart(cartId: string): Promise<ApiResponse<void>>;
  calculateTotal(items: CartItem[]): Promise<number>;
  validateCartItems(cartId: string): Promise<ApiResponse<{ valid: boolean; issues?: string[] }>>;
  syncCartPrices(cartId: string): Promise<ApiResponse<Cart>>;
  mergeGuestCart(sessionId: string, userId: string): Promise<ApiResponse<Cart>>;
  getCartSummary(cartId: string): Promise<ApiResponse<{
    itemCount: number;
    subtotal: number;
    estimatedTax: number;
    totalWeight: number;
  }>>;
}

export interface IOrderService {
  createOrder(orderData: CreateOrderData): Promise<ApiResponse<Order>>;
  getOrder(id: string): Promise<ApiResponse<Order>>;
  getOrderById(id: string): Promise<ApiResponse<Order>>;
  getUserOrders(userId: string): Promise<ApiResponse<Order[]>>;
  updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<Order>>;
  cancelOrder(orderId: string): Promise<ApiResponse<Order>>;
  getOrdersByStatus(status: string): Promise<ApiResponse<Order[]>>;
  getOrderStatistics(customerId?: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }>>;
  getRecentOrders(days: number, limit: number): Promise<ApiResponse<Order[]>>;
  trackOrder(trackingNumber: string): Promise<ApiResponse<{ order: Order; tracking: any }>>;
}

export interface CreateOrderData {
  customerId: string;
  items: CartItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  shippingRateId: string;
}

export interface IPaymentService {
  processPayment(paymentData: PaymentData): Promise<ApiResponse<PaymentResult>>;
  createSwishPayment(amount: number, phone: string, message: string): Promise<ApiResponse<SwishPayment>>;
  createKlarnaSession(orderData: KlarnaOrderData): Promise<ApiResponse<KlarnaSession>>;
  verifyPayment(paymentId: string, method: PaymentMethod): Promise<ApiResponse<boolean>>;
  createPaymentIntent(amount: number, currency: string): Promise<ApiResponse<{ clientSecret: string; paymentIntentId: string }>>;
  getPaymentMethods(): Promise<ApiResponse<Array<{ id: string; name: string; enabled: boolean }>>>;
}

export interface PaymentData {
  amount: number;
  currency: string;
  method: PaymentMethod;
  orderId: string;
  customerId: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  paymentId: string;
  status: 'success' | 'succeeded' | 'failed' | 'pending';
  transactionId?: string;
  redirectUrl?: string;
  amount?: number;
  currency?: string;
  referenceNumber?: string;
}

export interface SwishPayment {
  paymentId: string;
  qrCode: string;
  deepLink: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface KlarnaSession {
  sessionId: string;
  clientToken: string;
  paymentMethods: string[];
}

export interface KlarnaOrderData {
  amount: number;
  currency: string;
  locale: string;
  orderLines: KlarnaOrderLine[];
  shippingAddress: Address;
  billingAddress: Address;
}

export interface KlarnaOrderLine {
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

// Import segregated shipping interfaces
import type {
  IShippingRateService,
  IShippingLabelService,
  IShipmentTrackingService,
  IAddressValidationService,
  ISwedishShippingService,
  Shipment,
  TrackingInfo,
  TrackingEvent
} from './shipping';

// Re-export the segregated shipping interfaces
export type {
  IShippingRateService,
  IShippingLabelService,
  IShipmentTrackingService,
  IAddressValidationService,
  ISwedishShippingService,
  Shipment,
  TrackingInfo,
  TrackingEvent
};

/**
 * Legacy IShippingService - Composite interface for backward compatibility
 *
 * @deprecated Use the segregated interfaces instead:
 * - IShippingRateService for rate calculations
 * - IShippingLabelService for label generation
 * - IShipmentTrackingService for tracking
 * - IAddressValidationService for address validation
 * - ISwedishShippingService for Swedish-specific features
 */
export interface IShippingService
  extends
    IShippingRateService,
    IShippingLabelService,
    IShipmentTrackingService,
    IAddressValidationService,
    ISwedishShippingService {
  // Composite interface - all methods inherited from segregated interfaces
}

export interface IInventoryService {
  checkAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>>;
  reserveStock(items: CartItem[], customerId?: string, sessionId?: string): Promise<ApiResponse<string>>;
  releaseReservation(reservationId: string): Promise<ApiResponse<void>>;
  completeReservation(reservationId: string): Promise<ApiResponse<void>>;
  updateStock(productId: string, quantity: number): Promise<ApiResponse<void>>;
  getLowStockAlerts(): Promise<ApiResponse<Product[]>>;
  cleanupExpiredReservations(): Promise<ApiResponse<{ expiredCount: number }>>;
  getActiveReservations(productId: string): Promise<ApiResponse<number>>;
}

export interface IGDPRService {
  exportUserData(userId: string): Promise<ApiResponse<UserData>>;
  deleteUserData(userId: string): Promise<ApiResponse<void>>;
  updateConsent(userId: string, consentData: ConsentData): Promise<ApiResponse<void>>;
  getConsentStatus(userId: string): Promise<ApiResponse<ConsentData>>;
  requestDataPortability(userId: string, format: 'json' | 'csv'): Promise<ApiResponse<any>>;
  getDataProcessingPurposes(): Promise<ApiResponse<Array<{ id: string; name: string; description: string }>>>;
  getDataRetentionPolicies(): Promise<ApiResponse<Array<{ dataType: string; retentionPeriod: string; purpose: string }>>>;
  getGDPRActivityLog(userId: string): Promise<ApiResponse<Array<{ action: string; timestamp: string; details: string }>>>;
}

export interface UserData {
  personalInfo: Customer;
  orders: Order[];
  preferences: UserPreferences;
}

export interface ConsentData {
  marketing: boolean;
  analytics: boolean;
  functional: boolean;
  updatedAt: Date;
}

export interface UserPreferences {
  language: string;
  currency: string;
  newsletter: boolean;
}