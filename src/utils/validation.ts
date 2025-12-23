import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['essential-oils', 'carrier-oils', 'diffusers', 'accessories', 'gift-sets']),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  weight: z.number().positive('Weight must be positive'),
  sku: z.string().min(1, 'SKU is required'),
});

export const customerSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  consentGiven: z.boolean(),
  marketingOptIn: z.boolean().default(false),
});

export const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().regex(/^\d{3}\s?\d{2}$/, 'Invalid Swedish postal code'),
  country: z.string().default('Sweden'),
  region: z.string().optional(),
});

export const cartItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive').max(99),
  price: z.number().nonnegative().optional(),
});

export const orderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  items: z.array(cartItemSchema).min(1, 'Order must have at least one item'),
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: z.enum(['swish', 'klarna', 'card', 'bank-transfer']),
  shippingRateId: z.string().uuid('Invalid shipping rate ID'),
});

export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  marketingOptIn: z.boolean().default(false),
  consentGiven: z.literal(true, { message: 'You must accept the terms and conditions' }),
});

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const paymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('SEK'),
  method: z.enum(['swish', 'klarna', 'card', 'bank-transfer']),
  orderId: z.string().uuid('Invalid order ID'),
});

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  locale: z.enum(['en', 'sv']).default('sv'),
});

export const gdprSchema = z.object({
  marketing: z.boolean(),
  analytics: z.boolean(),
  functional: z.boolean().default(true),
});