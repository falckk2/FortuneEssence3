import { 
  Product, 
  Customer, 
  Order, 
  Cart, 
  CartItem,
  PaymentMethod,
  ShippingRate,
  Address,
  ApiResponse 
} from '@/types';

export interface IAuthService {
  signIn(email: string, password: string): Promise<ApiResponse<{ user: Customer; token: string }>>;
  signUp(userData: SignUpData): Promise<ApiResponse<Customer>>;
  signOut(): Promise<ApiResponse<void>>;
  getCurrentUser(): Promise<ApiResponse<Customer>>;
  resetPassword(email: string): Promise<ApiResponse<void>>;
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
}

export interface ProductSearchParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  locale?: string;
}

export interface ICartService {
  getCart(userId?: string, sessionId?: string): Promise<ApiResponse<Cart>>;
  addItem(cartId: string, item: CartItem): Promise<ApiResponse<Cart>>;
  removeItem(cartId: string, productId: string): Promise<ApiResponse<Cart>>;
  updateQuantity(cartId: string, productId: string, quantity: number): Promise<ApiResponse<Cart>>;
  clearCart(cartId: string): Promise<ApiResponse<void>>;
  calculateTotal(items: CartItem[]): Promise<number>;
}

export interface IOrderService {
  createOrder(orderData: CreateOrderData): Promise<ApiResponse<Order>>;
  getOrder(id: string): Promise<ApiResponse<Order>>;
  getUserOrders(userId: string): Promise<ApiResponse<Order[]>>;
  updateOrderStatus(orderId: string, status: string): Promise<ApiResponse<Order>>;
  cancelOrder(orderId: string): Promise<ApiResponse<Order>>;
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
  reserveStock(items: CartItem[]): Promise<ApiResponse<string>>;
  releaseReservation(reservationId: string): Promise<ApiResponse<void>>;
  updateStock(productId: string, quantity: number): Promise<ApiResponse<void>>;
  getLowStockAlerts(): Promise<ApiResponse<Product[]>>;
}

export interface IGDPRService {
  exportUserData(userId: string): Promise<ApiResponse<UserData>>;
  deleteUserData(userId: string): Promise<ApiResponse<void>>;
  updateConsent(userId: string, consentData: ConsentData): Promise<ApiResponse<void>>;
  getConsentStatus(userId: string): Promise<ApiResponse<ConsentData>>;
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