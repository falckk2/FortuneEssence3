import 'reflect-metadata';
import { OrderItemRepository } from '@/repositories/orders/OrderItemRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError } from '../helpers/mockSupabase';
import type { OrderItem } from '@/types';

describe('OrderItemRepository', () => {
  let repository: OrderItemRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockOrderItems: OrderItem[] = [
    {
      productId: 'prod-1',
      productName: 'Lavender Oil',
      quantity: 2,
      price: 89.00,
      total: 178.00,
    },
    {
      productId: 'prod-2',
      productName: 'Eucalyptus Oil',
      quantity: 1,
      price: 249.00,
      total: 249.00,
    },
  ];

  const mockDbOrderItems = [
    {
      id: 'oi-1',
      order_id: 'order-1',
      product_id: 'prod-1',
      quantity: 2,
      price: 89.00,
      created_at: '2025-01-01T10:00:00Z',
      product: { id: 'prod-1', name_sv: 'Lavendel Eterisk Olja', category: 'essential-oils' },
    },
    {
      id: 'oi-2',
      order_id: 'order-1',
      product_id: 'prod-2',
      quantity: 1,
      price: 249.00,
      created_at: '2025-01-01T10:00:00Z',
      product: { id: 'prod-2', name_sv: 'Eucalyptus Eterisk Olja', category: 'essential-oils' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    // DI-injected repo: pass mock directly to constructor
    repository = new OrderItemRepository(mockSupabase as any);
  });

  describe('createMany', () => {
    it('should insert multiple order items', async () => {
      mockSupabase.mockQuery.insert = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.createMany('order-1', mockOrderItems);

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('order_items');
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalledWith([
        { order_id: 'order-1', product_id: 'prod-1', quantity: 2, price: 89.00 },
        { order_id: 'order-1', product_id: 'prod-2', quantity: 1, price: 249.00 },
      ]);
    });

    it('should handle empty items array', async () => {
      mockSupabase.mockQuery.insert = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.createMany('order-1', []);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalledWith([]);
    });

    it('should return error on database failure', async () => {
      mockSupabase.mockQuery.insert = jest.fn().mockResolvedValue(
        mockSupabaseError('Foreign key violation')
      );

      const result = await repository.createMany('order-1', mockOrderItems);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Foreign key violation');
    });
  });

  describe('findByOrderId', () => {
    it('should return order items with product data', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrderItems)
      );

      const result = await repository.findByOrderId('order-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].productId).toBe('prod-1');
      expect(result.data?.[0].productName).toBe('Lavendel Eterisk Olja');
      expect(result.data?.[0].total).toBe(178.00); // price * quantity
      expect(mockSupabase.from).toHaveBeenCalledWith('order_items');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('order_id', 'order-1');
    });

    it('should return empty array when no items exist', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([])
      );

      const result = await repository.findByOrderId('order-empty');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.findByOrderId('order-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('findByProductId', () => {
    it('should return items for a specific product', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrderItems[0]])
      );

      const result = await repository.findByProductId('prod-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].productId).toBe('prod-1');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-1');
    });

    it('should filter by date range when provided', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrderItems[0]])
      );

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      const result = await repository.findByProductId('prod-1', startDate, endDate);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.gte).toHaveBeenCalledWith('created_at', startDate.toISOString());
      expect(mockSupabase.mockQuery.lte).toHaveBeenCalledWith('created_at', endDate.toISOString());
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection failed')
      );

      const result = await repository.findByProductId('prod-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('data transformation', () => {
    it('should compute total as price * quantity', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrderItems)
      );

      const result = await repository.findByOrderId('order-1');

      expect(result.data?.[0].total).toBe(89.00 * 2); // 178.00
      expect(result.data?.[1].total).toBe(249.00 * 1); // 249.00
    });

    it('should handle missing product relation gracefully', async () => {
      const itemWithoutProduct = [{
        ...mockDbOrderItems[0],
        product: null,
      }];

      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(itemWithoutProduct)
      );

      const result = await repository.findByOrderId('order-1');

      expect(result.success).toBe(true);
      expect(result.data?.[0].productName).toBe('');
    });
  });
});
