import { OrderRepository } from '@/repositories/orders/OrderRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError, mockSupabaseNotFound } from '../helpers/mockSupabase';
import type { Order, OrderItem, Address } from '@/types';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockAddress: Address = {
    street: '123 Main St',
    city: 'Stockholm',
    postalCode: '11122',
    country: 'Sweden',
  };

  const mockOrderItems: OrderItem[] = [
    {
      productId: 'prod-1',
      productName: 'Lavender Oil',
      quantity: 2,
      price: 299.99,
      total: 599.98,
    },
  ];

  const mockDbOrder = {
    id: 'order-1',
    customer_id: 'customer-1',
    items: mockOrderItems,
    total: 649.98,
    tax: 50,
    shipping: 0,
    status: 'pending',
    shipping_address: mockAddress,
    billing_address: mockAddress,
    payment_method: 'stripe',
    payment_id: 'pi_123',
    tracking_number: null,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
  };

  const mockOrder: Order = {
    id: 'order-1',
    customerId: 'customer-1',
    items: mockOrderItems,
    total: 649.98,
    tax: 50,
    shipping: 0,
    status: 'pending',
    shippingAddress: mockAddress,
    billingAddress: mockAddress,
    paymentMethod: 'stripe',
    paymentId: 'pi_123',
    createdAt: new Date('2025-01-01T10:00:00Z'),
    updatedAt: new Date('2025-01-01T10:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const supabaseModule = require('@/lib/supabase');
    supabaseModule.supabase = mockSupabase;
    repository = new OrderRepository();
  });

  describe('findAll', () => {
    it('should return all orders sorted by creation date', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrder])
      );

      const result = await repository.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('order-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockSupabase.mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should filter orders by customer ID', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrder])
      );

      const result = await repository.findAll('customer-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection failed')
      );

      const result = await repository.findAll();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('findById', () => {
    it('should return order by id', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrder)
      );

      const result = await repository.findById('order-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('order-1');
      expect(result.data?.customerId).toBe('customer-1');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'order-1');
    });

    it('should return error when order not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.findById('order-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('findByCustomerId', () => {
    it('should return customer orders', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrder])
      );

      const result = await repository.findByCustomerId('customer-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
    });

    it('should limit results when limit is provided', async () => {
      mockSupabase.mockQuery.limit = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrder])
      );

      const result = await repository.findByCustomerId('customer-1', 5);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.findByCustomerId('customer-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('findByStatus', () => {
    it('should return orders by status', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrder])
      );

      const result = await repository.findByStatus('pending');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('status', 'pending');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.findByStatus('pending');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('findByTrackingNumber', () => {
    it('should return order by tracking number', async () => {
      const orderWithTracking = { ...mockDbOrder, tracking_number: 'TRACK123' };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(orderWithTracking)
      );

      const result = await repository.findByTrackingNumber('TRACK123');

      expect(result.success).toBe(true);
      expect(result.data?.trackingNumber).toBe('TRACK123');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('tracking_number', 'TRACK123');
    });

    it('should return error when order not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.findByTrackingNumber('INVALID');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('create', () => {
    it('should create a new order successfully', async () => {
      const newOrder = {
        customerId: 'customer-1',
        items: mockOrderItems,
        total: 649.98,
        tax: 50,
        shipping: 0,
        status: 'pending' as const,
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        paymentMethod: 'stripe' as const,
        paymentId: 'pi_123',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrder)
      );

      const result = await repository.create(newOrder);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('order-1');
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      const newOrder = {
        customerId: 'customer-1',
        items: mockOrderItems,
        total: 649.98,
        tax: 50,
        shipping: 0,
        status: 'pending' as const,
        shippingAddress: mockAddress,
        billingAddress: mockAddress,
        paymentMethod: 'stripe' as const,
        paymentId: 'pi_123',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Insert failed')
      );

      const result = await repository.create(newOrder);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insert failed');
    });
  });

  describe('update', () => {
    it('should update order successfully', async () => {
      const updates = {
        status: 'confirmed' as const,
        trackingNumber: 'TRACK123',
      };

      const updatedDbOrder = {
        ...mockDbOrder,
        status: 'confirmed',
        tracking_number: 'TRACK123',
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(updatedDbOrder)
      );

      const result = await repository.update('order-1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('confirmed');
      expect(result.data?.trackingNumber).toBe('TRACK123');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'order-1');
    });

    it('should return error when order not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.update('nonexistent', { status: 'confirmed' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Update failed')
      );

      const result = await repository.update('order-1', { status: 'confirmed' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update failed');
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      const updatedDbOrder = { ...mockDbOrder, status: 'shipped' };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(updatedDbOrder)
      );

      const result = await repository.updateStatus('order-1', 'shipped');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('shipped');
      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith({ status: 'shipped' });
    });

    it('should update status with tracking number', async () => {
      const updatedDbOrder = { ...mockDbOrder, status: 'shipped', tracking_number: 'TRACK123' };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(updatedDbOrder)
      );

      const result = await repository.updateStatus('order-1', 'shipped', 'TRACK123');

      expect(result.success).toBe(true);
      expect(result.data?.trackingNumber).toBe('TRACK123');
    });

    it('should return error when order not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.updateStatus('nonexistent', 'shipped');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('getOrderStatistics', () => {
    it('should return order statistics for all orders', async () => {
      const mockOrders = [
        { status: 'pending' },
        { status: 'confirmed' },
        { status: 'pending' },
        { status: 'shipped' },
      ];

      mockSupabase.mockQuery.select = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockOrders)
      );

      const result = await repository.getOrderStatistics();

      expect(result.success).toBe(true);
      expect(result.data?.total).toBe(4);
      expect(result.data?.pending).toBe(2);
      expect(result.data?.confirmed).toBe(1);
      expect(result.data?.shipped).toBe(1);
    });

    it('should return order statistics for specific customer', async () => {
      const mockOrders = [
        { status: 'pending' },
        { status: 'confirmed' },
      ];

      mockSupabase.mockQuery.select = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockOrders)
      );

      const result = await repository.getOrderStatistics('customer-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('customer_id', 'customer-1');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.select = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.getOrderStatistics();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('getRecentOrders', () => {
    it('should return orders from last 30 days by default', async () => {
      mockSupabase.mockQuery.limit = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrder])
      );

      const result = await repository.getRecentOrders();

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.gte).toHaveBeenCalled();
      expect(mockSupabase.mockQuery.limit).toHaveBeenCalledWith(50);
    });

    it('should return orders with custom days and limit', async () => {
      mockSupabase.mockQuery.limit = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbOrder])
      );

      const result = await repository.getRecentOrders(7, 10);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.limit).toHaveBeenCalledWith(10);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.limit = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.getRecentOrders();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('data transformation', () => {
    it('should correctly transform database record to domain model', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrder)
      );

      const result = await repository.findById('order-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('order-1');
      expect(result.data?.customerId).toBe('customer-1');
      expect(result.data?.shippingAddress).toEqual(mockAddress);
      expect(result.data?.billingAddress).toEqual(mockAddress);
      expect(result.data?.paymentMethod).toBe('stripe');
      expect(result.data?.createdAt).toBeInstanceOf(Date);
      expect(result.data?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle null tracking number', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbOrder)
      );

      const result = await repository.findById('order-1');

      expect(result.success).toBe(true);
      expect(result.data?.trackingNumber).toBeNull();
    });
  });
});
