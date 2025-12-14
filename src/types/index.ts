export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  images: string[];
  stock: number;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  translations: ProductTranslations;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
}

export interface ProductTranslations {
  sv: {
    name: string;
    description: string;
  };
  en: {
    name: string;
    description: string;
  };
}

export type ProductCategory =
  | 'essential-oils'
  | 'carrier-oils'
  | 'diffusers'
  | 'accessories'
  | 'gift-sets'
  | 'bundles';

export interface ProductSearchParams {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  locale?: string;
}

export interface BundleConfiguration {
  id: string;
  bundleProductId: string;
  requiredQuantity: number;
  allowedCategory: ProductCategory;
  discountPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BundleSelection {
  bundleProductId: string;
  selectedProductIds: string[];
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  bundleSelection?: BundleSelection;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  address: Address;
  createdAt: Date;
  updatedAt: Date;
  consentGiven: boolean;
  marketingOptIn: boolean;
}

export interface Address {
  firstName?: string;
  lastName?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  region?: string;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  tax: number;
  shipping: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentId: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  bundleSelection?: BundleSelection;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed' 
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod =
  | 'stripe'
  | 'swish'
  | 'klarna'
  | 'card'
  | 'bank-transfer';

export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  country: string;
  maxWeight: number;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  lastUpdated: Date;
}

export interface AbandonedCart {
  id: string;
  cartId: string;
  customerId?: string;
  email: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  currency: string;
  recoveryToken: string;
  abandonedAt: Date;
  remindedAt?: Date;
  recoveredAt?: Date;
  recoveryOrderId?: string;
  reminderCount: number;
  status: AbandonedCartStatus;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AbandonedCartStatus =
  | 'abandoned'
  | 'reminded'
  | 'recovered'
  | 'expired';

export interface AbandonedCartCreateData {
  cartId: string;
  customerId?: string;
  email: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  currency: string;
  recoveryToken: string;
  abandonedAt: Date;
  status: AbandonedCartStatus;
  reminderCount: number;
  ipAddress?: string;
  userAgent?: string;
}

export type Locale = 'en' | 'sv';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}