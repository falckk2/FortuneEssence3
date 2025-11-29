import { 
  Product, 
  Customer, 
  Order, 
  Cart, 
  InventoryItem,
  ShippingRate,
  ApiResponse 
} from '@/types';

export interface IProductRepository {
  findAll(params?: ProductSearchParams): Promise<ApiResponse<Product[]>>;
  findById(id: string): Promise<ApiResponse<Product>>;
  findByCategory(category: string): Promise<ApiResponse<Product[]>>;
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
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Order>>;
  update(id: string, order: Partial<Order>): Promise<ApiResponse<Order>>;
  findByStatus(status: string): Promise<ApiResponse<Order[]>>;
}

export interface ICartRepository {
  findByUserId(userId: string): Promise<ApiResponse<Cart>>;
  findBySessionId(sessionId: string): Promise<ApiResponse<Cart>>;
  create(cart: Omit<Cart, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Cart>>;
  update(id: string, cart: Partial<Cart>): Promise<ApiResponse<Cart>>;
  delete(id: string): Promise<ApiResponse<void>>;
}

export interface IInventoryRepository {
  findByProductId(productId: string): Promise<ApiResponse<InventoryItem>>;
  updateStock(productId: string, quantity: number): Promise<ApiResponse<InventoryItem>>;
  reserveStock(productId: string, quantity: number): Promise<ApiResponse<boolean>>;
  releaseReservedStock(productId: string, quantity: number): Promise<ApiResponse<boolean>>;
}

export interface IShippingRepository {
  findRatesByCountry(country: string): Promise<ApiResponse<ShippingRate[]>>;
  calculateShipping(weight: number, country: string): Promise<ApiResponse<ShippingRate>>;
}