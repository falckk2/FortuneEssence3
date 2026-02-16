import 'reflect-metadata';
import { AnalyticsRepository } from '@/repositories/analytics/AnalyticsRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError } from '../helpers/mockSupabase';

describe('AnalyticsRepository', () => {
  let repository: AnalyticsRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-01-31');

  const mockDbOrders = [
    {
      id: 'order-1',
      customer_id: 'cust-1',
      items: [{ productId: 'prod-1', quantity: 2, price: 89 }],
      total: 228.00,
      tax: 44.50,
      shipping: 49.00,
      status: 'confirmed',
      shipping_address: { street: 'Test 1', city: 'Stockholm', postalCode: '111', country: 'Sweden' },
      billing_address: { street: 'Test 1', city: 'Stockholm', postalCode: '111', country: 'Sweden' },
      payment_method: 'stripe',
      payment_id: 'pay-1',
      tracking_number: null,
      carrier: null,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z',
    },
    {
      id: 'order-2',
      customer_id: 'cust-2',
      items: [{ productId: 'prod-2', quantity: 1, price: 249 }],
      total: 360.25,
      tax: 62.25,
      shipping: 49.00,
      status: 'delivered',
      shipping_address: { street: 'Test 2', city: 'Göteborg', postalCode: '222', country: 'Sweden' },
      billing_address: { street: 'Test 2', city: 'Göteborg', postalCode: '222', country: 'Sweden' },
      payment_method: 'klarna',
      payment_id: 'pay-2',
      tracking_number: 'TRACK-1',
      carrier: 'PostNord',
      created_at: '2025-01-20T10:00:00Z',
      updated_at: '2025-01-20T10:00:00Z',
    },
  ];

  const mockDbOrderItems = [
    {
      product_id: 'prod-1',
      quantity: 2,
      price: 89.00,
      product: { id: 'prod-1', name_sv: 'Lavendel Olja', category: 'essential-oils' },
    },
    {
      product_id: 'prod-2',
      quantity: 1,
      price: 249.00,
      product: { id: 'prod-2', name_sv: 'Eucalyptus Olja', category: 'essential-oils' },
    },
    {
      product_id: 'prod-3',
      quantity: 1,
      price: 799.00,
      product: { id: 'prod-3', name_sv: 'Aroma Diffuser', category: 'diffusers' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    repository = new AnalyticsRepository(mockSupabase as any);
  });

  describe('getOrdersInRange', () => {
    it('should return orders within date range excluding cancelled', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrders)
      );

      const result = await repository.getOrdersInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockSupabase.mockQuery.gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(mockSupabase.mockQuery.lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
      expect(mockSupabase.mockQuery.neq).toHaveBeenCalledWith('status', 'cancelled');
    });

    it('should correctly transform snake_case to camelCase', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrders[0]])
      );

      const result = await repository.getOrdersInRange(startDate, endDate);

      expect(result.data?.[0].customerId).toBe('cust-1');
      expect(result.data?.[0].paymentMethod).toBe('stripe');
      expect(result.data?.[0].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array when no orders exist', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([])
      );

      const result = await repository.getOrdersInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should return empty array when data is null', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.getOrdersInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection timeout')
      );

      const result = await repository.getOrdersInRange(startDate, endDate);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection timeout');
    });
  });

  describe('getOrderItemsInRange', () => {
    it('should return order items with product joins', async () => {
      mockSupabase.mockQuery.lte = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrderItems)
      );

      const result = await repository.getOrderItemsInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0]).toEqual({
        productId: 'prod-1',
        productName: 'Lavendel Olja',
        category: 'essential-oils',
        quantity: 2,
        price: 89.00,
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('order_items');
    });

    it('should handle missing product relation', async () => {
      const itemsWithNullProduct = [{
        product_id: 'prod-1',
        quantity: 1,
        price: 89.00,
        product: null,
      }];

      mockSupabase.mockQuery.lte = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(itemsWithNullProduct)
      );

      const result = await repository.getOrderItemsInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data?.[0].productName).toBe('');
      expect(result.data?.[0].category).toBe('');
    });

    it('should return empty array when no items exist', async () => {
      mockSupabase.mockQuery.lte = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([])
      );

      const result = await repository.getOrderItemsInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.lte = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.getOrderItemsInRange(startDate, endDate);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('getCustomerCountInRange', () => {
    it('should return count of new customers', async () => {
      mockSupabase.mockQuery.lte = jest.fn().mockResolvedValue({
        count: 15,
        error: null,
      });

      const result = await repository.getCustomerCountInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toBe(15);
      expect(mockSupabase.from).toHaveBeenCalledWith('customers');
    });

    it('should return 0 when count is null', async () => {
      mockSupabase.mockQuery.lte = jest.fn().mockResolvedValue({
        count: null,
        error: null,
      });

      const result = await repository.getCustomerCountInRange(startDate, endDate);

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.lte = jest.fn().mockResolvedValue({
        count: null,
        error: { message: 'Count failed', code: 'PGRST000' },
      });

      const result = await repository.getCustomerCountInRange(startDate, endDate);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Count failed');
    });
  });

  describe('getTotalCustomerCount', () => {
    it('should return total customer count', async () => {
      mockSupabase.mockQuery.select = jest.fn().mockResolvedValue({
        count: 245,
        error: null,
      });

      const result = await repository.getTotalCustomerCount();

      expect(result.success).toBe(true);
      expect(result.data).toBe(245);
      expect(mockSupabase.from).toHaveBeenCalledWith('customers');
    });

    it('should return 0 when no customers', async () => {
      mockSupabase.mockQuery.select = jest.fn().mockResolvedValue({
        count: 0,
        error: null,
      });

      const result = await repository.getTotalCustomerCount();

      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.select = jest.fn().mockResolvedValue({
        count: null,
        error: { message: 'Connection refused', code: 'PGRST000' },
      });

      const result = await repository.getTotalCustomerCount();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });
});
