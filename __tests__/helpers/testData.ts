import type { AbandonedCart, CartItem, Cart, Product } from '@/types';

/**
 * Test data factories for abandoned cart recovery tests
 */

export const mockCartItems: CartItem[] = [
  {
    productId: 'prod-1',
    quantity: 2,
    price: 299.99,
  },
  {
    productId: 'prod-2',
    quantity: 1,
    price: 149.50,
  },
];

export const mockCart: Cart = {
  id: 'cart-123',
  userId: 'user-456',
  items: mockCartItems,
  total: 749.48,
  createdAt: new Date('2025-01-01T10:00:00Z'),
  updatedAt: new Date('2025-01-01T12:00:00Z'),
};

export const mockAbandonedCart: AbandonedCart = {
  id: 'abandoned-cart-1',
  cartId: 'cart-123',
  customerId: 'user-456',
  email: 'test@example.com',
  sessionId: 'session-789',
  items: mockCartItems,
  subtotal: 749.48,
  total: 749.48,
  currency: 'SEK',
  recoveryToken: 'token-abc123def456',
  abandonedAt: new Date('2025-01-01T12:00:00Z'),
  remindedAt: undefined,
  recoveredAt: undefined,
  recoveryOrderId: undefined,
  reminderCount: 0,
  status: 'abandoned',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  createdAt: new Date('2025-01-01T12:00:00Z'),
  updatedAt: new Date('2025-01-01T12:00:00Z'),
};

export const mockRemindedCart: AbandonedCart = {
  ...mockAbandonedCart,
  id: 'abandoned-cart-2',
  reminderCount: 1,
  status: 'reminded',
  remindedAt: new Date('2025-01-01T13:00:00Z'),
  updatedAt: new Date('2025-01-01T13:00:00Z'),
};

export const mockRecoveredCart: AbandonedCart = {
  ...mockAbandonedCart,
  id: 'abandoned-cart-3',
  status: 'recovered',
  recoveredAt: new Date('2025-01-01T14:00:00Z'),
  recoveryOrderId: 'order-789',
  updatedAt: new Date('2025-01-01T14:00:00Z'),
};

export const mockExpiredCart: AbandonedCart = {
  ...mockAbandonedCart,
  id: 'abandoned-cart-4',
  status: 'expired',
  abandonedAt: new Date('2024-12-01T12:00:00Z'), // 31+ days old
  updatedAt: new Date('2025-01-01T12:00:00Z'),
};

export const mockProduct: Product = {
  id: 'prod-1',
  name: 'Lavender Essential Oil',
  description: 'Premium organic lavender oil',
  price: 299.99,
  category: 'essential-oils',
  images: ['lavender.jpg'],
  stock: 50,
  sku: 'LAV-001',
  weight: 0.1,
  dimensions: { length: 5, width: 5, height: 10 },
  isActive: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  translations: {
    sv: {
      name: 'Lavendel Eterisk Olja',
      description: 'Premium ekologisk lavendelolja',
    },
    en: {
      name: 'Lavender Essential Oil',
      description: 'Premium organic lavender oil',
    },
  },
};

export const mockDbAbandonedCart = {
  id: mockAbandonedCart.id,
  cart_id: mockAbandonedCart.cartId,
  customer_id: mockAbandonedCart.customerId,
  email: mockAbandonedCart.email,
  session_id: mockAbandonedCart.sessionId,
  items: mockAbandonedCart.items,
  subtotal: mockAbandonedCart.subtotal,
  total: mockAbandonedCart.total,
  currency: mockAbandonedCart.currency,
  recovery_token: mockAbandonedCart.recoveryToken,
  abandoned_at: mockAbandonedCart.abandonedAt.toISOString(),
  reminded_at: null,
  recovered_at: null,
  recovery_order_id: null,
  reminder_count: mockAbandonedCart.reminderCount,
  status: mockAbandonedCart.status,
  ip_address: mockAbandonedCart.ipAddress,
  user_agent: mockAbandonedCart.userAgent,
  created_at: mockAbandonedCart.createdAt.toISOString(),
  updated_at: mockAbandonedCart.updatedAt.toISOString(),
};
