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
  ApiResponse
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

export interface ICartService {
  getCart(userId?: string, sessionId?: string): Promise<ApiResponse<Cart>>;
  addItem(cartId: string, item: CartItem): Promise<ApiResponse<Cart>>;
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
  // Abandoned cart recovery methods
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

export interface IOrderService {
  createOrder(orderData: CreateOrderData): Promise<ApiResponse<Order>>;
  getOrder(id: string): Promise<ApiResponse<Order>>;
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
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  redirectUrl?: string;
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

export interface IShippingService {
  getShippingRates(country: string, weight: number): Promise<ApiResponse<ShippingRate[]>>;
  calculateShipping(items: CartItem[], country: string): Promise<ApiResponse<ShippingRate>>;
  createShipment(orderId: string, shippingRateId: string): Promise<ApiResponse<Shipment>>;
  trackShipment(trackingNumber: string): Promise<ApiResponse<TrackingInfo>>;
  validateDeliveryAddress(address: Address): Promise<ApiResponse<{ valid: boolean; suggestions?: Address[] }>>;
  getSupportedCountries(): Promise<ApiResponse<Array<{ code: string; name: string }>>>;
  getSwedishCarrierServices(): Promise<ApiResponse<Array<{
    carrier: string;
    services: Array<{
      name: string;
      description: string;
      estimatedDays: number;
      maxWeight: number;
      features: string[];
    }>;
  }>>>;
  validateSwedishPostalCode(postalCode: string): Promise<ApiResponse<{ valid: boolean; city?: string }>>;
  calculateSwedishShippingWithZones(items: CartItem[], postalCode: string): Promise<ApiResponse<{
    baseRate: ShippingRate;
    adjustedRate: ShippingRate;
    zoneInfo: { zone: string; additionalDays: number };
  }>>;
  getShippingCosts(items: CartItem[], country: string): Promise<ApiResponse<{
    options: ShippingRate[];
    recommended: ShippingRate;
    freeShippingThreshold?: number;
  }>>;
  calculateEcoShipping(items: CartItem[], country: string): Promise<ApiResponse<{
    standardRate: ShippingRate;
    ecoRate: ShippingRate;
    carbonOffset: { kg: number; cost: number };
  }>>;
  getSwedishHolidayImpact(date: string): Promise<ApiResponse<{ isHoliday: boolean; estimatedDelay?: number }>>;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'shipped' | 'delivered';
  estimatedDelivery: Date;
}

export interface TrackingInfo {
  trackingNumber: string;
  status: string;
  location: string;
  estimatedDelivery: Date;
  history: TrackingEvent[];
}

export interface TrackingEvent {
  date: Date;
  status: string;
  location: string;
  description: string;
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