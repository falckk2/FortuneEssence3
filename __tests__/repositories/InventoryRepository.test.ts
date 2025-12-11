import { InventoryRepository } from '@/repositories/inventory/InventoryRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError, mockSupabaseNotFound } from '../helpers/mockSupabase';
import type { InventoryItem } from '@/types';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

describe('InventoryRepository', () => {
  let repository: InventoryRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockDbInventoryItem = {
    product_id: 'prod-1',
    quantity: 100,
    reserved_quantity: 10,
    reorder_level: 20,
    last_updated: '2025-01-01T12:00:00Z',
  };

  const mockInventoryItem: InventoryItem = {
    productId: 'prod-1',
    quantity: 100,
    reservedQuantity: 10,
    reorderLevel: 20,
    lastUpdated: new Date('2025-01-01T12:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const supabaseModule = require('@/lib/supabase');
    supabaseModule.supabase = mockSupabase;
    repository = new InventoryRepository();
  });

  describe('findByProductId', () => {
    it('should return inventory by product id', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbInventoryItem)
      );

      const result = await repository.findByProductId('prod-1');

      expect(result.success).toBe(true);
      expect(result.data?.productId).toBe('prod-1');
      expect(result.data?.quantity).toBe(100);
      expect(result.data?.reservedQuantity).toBe(10);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('product_id', 'prod-1');
    });

    it('should return error when inventory not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.findByProductId('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Inventory record not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection failed')
      );

      const result = await repository.findByProductId('prod-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  describe('updateStock', () => {
    it('should update existing inventory stock', async () => {
      // Mock findByProductId success
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseSuccess(mockDbInventoryItem)) // findByProductId
        .mockResolvedValueOnce(mockSupabaseSuccess({ ...mockDbInventoryItem, quantity: 150 })); // update

      const result = await repository.updateStock('prod-1', 150);

      expect(result.success).toBe(true);
      expect(result.data?.quantity).toBe(150);
      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith({ quantity: 150 });
    });

    it('should create new inventory record when it does not exist', async () => {
      // Mock findByProductId failure, then insert success
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseNotFound()) // findByProductId - not found
        .mockResolvedValueOnce(mockSupabaseSuccess({ ...mockDbInventoryItem, quantity: 50 })); // insert

      const result = await repository.updateStock('prod-new', 50);

      expect(result.success).toBe(true);
      expect(result.data?.quantity).toBe(50);
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should not allow negative stock quantities', async () => {
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseSuccess(mockDbInventoryItem))
        .mockResolvedValueOnce(mockSupabaseSuccess({ ...mockDbInventoryItem, quantity: 0 }));

      const result = await repository.updateStock('prod-1', -10);

      expect(result.success).toBe(true);
      expect(result.data?.quantity).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseSuccess(mockDbInventoryItem))
        .mockResolvedValueOnce(mockSupabaseError('Update failed'));

      const result = await repository.updateStock('prod-1', 150);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update failed');
    });
  });

  describe('reserveStock', () => {
    it('should reserve stock when sufficient quantity available', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbInventoryItem)
      );

      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.reserveStock('prod-1', 5);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith({
        reserved_quantity: 15, // 10 + 5
      });
    });

    it('should return error when insufficient stock available', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbInventoryItem)
      );

      const result = await repository.reserveStock('prod-1', 100); // Available: 100 - 10 = 90

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient stock available');
    });

    it('should return error when product not in inventory', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.reserveStock('nonexistent', 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found in inventory');
    });
  });

  describe('releaseReservedStock', () => {
    it('should release reserved stock', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbInventoryItem)
      );

      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.releaseReservedStock('prod-1', 5);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith({
        reserved_quantity: 5, // 10 - 5
      });
    });

    it('should not allow negative reserved quantities', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbInventoryItem)
      );

      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.releaseReservedStock('prod-1', 20); // More than reserved

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith({
        reserved_quantity: 0,
      });
    });

    it('should return error when product not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.releaseReservedStock('nonexistent', 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found in inventory');
    });
  });

  describe('confirmReservation', () => {
    it('should confirm reservation by reducing quantity and reserved quantity', async () => {
      mockSupabase.mockQuery.single = jest.fn()
        .mockResolvedValueOnce(mockSupabaseSuccess(mockDbInventoryItem))
        .mockResolvedValueOnce(mockSupabaseSuccess({
          ...mockDbInventoryItem,
          quantity: 95,
          reserved_quantity: 5,
        }));

      const result = await repository.confirmReservation('prod-1', 5);

      expect(result.success).toBe(true);
      expect(result.data?.quantity).toBe(95);
      expect(result.data?.reservedQuantity).toBe(5);
    });

    it('should return error when not enough reserved stock', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbInventoryItem)
      );

      const result = await repository.confirmReservation('prod-1', 20); // Only 10 reserved

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not enough reserved stock to confirm');
    });

    it('should return error when product not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.confirmReservation('nonexistent', 5);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found in inventory');
    });
  });

  describe('getLowStockItems', () => {
    it('should return items below threshold', async () => {
      const mockLowStockItems = [
        { ...mockDbInventoryItem, product_id: 'prod-1', quantity: 5 },
        { ...mockDbInventoryItem, product_id: 'prod-2', quantity: 8 },
      ];

      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockLowStockItems)
      );

      const result = await repository.getLowStockItems(10);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
      expect(mockSupabase.mockQuery.lte).toHaveBeenCalledWith('quantity', 10);
    });

    it('should filter by reorder level when no threshold provided', async () => {
      const mockItems = [
        { ...mockDbInventoryItem, product_id: 'prod-1', quantity: 15, reorder_level: 20 },
        { ...mockDbInventoryItem, product_id: 'prod-2', quantity: 25, reorder_level: 20 },
      ];

      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockItems)
      );

      const result = await repository.getLowStockItems();

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1); // Only prod-1 with quantity 15 <= reorder_level 20
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.getLowStockItems();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('updateReorderLevel', () => {
    it('should update reorder level successfully', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({ ...mockDbInventoryItem, reorder_level: 30 })
      );

      const result = await repository.updateReorderLevel('prod-1', 30);

      expect(result.success).toBe(true);
      expect(result.data?.reorderLevel).toBe(30);
      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith({ reorder_level: 30 });
    });

    it('should not allow negative reorder levels', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({ ...mockDbInventoryItem, reorder_level: 0 })
      );

      const result = await repository.updateReorderLevel('prod-1', -5);

      expect(result.success).toBe(true);
      expect(result.data?.reorderLevel).toBe(0);
    });

    it('should return error when inventory not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.updateReorderLevel('nonexistent', 30);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Inventory record not found');
    });
  });

  describe('data transformation', () => {
    it('should correctly transform database record to domain model', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbInventoryItem)
      );

      const result = await repository.findByProductId('prod-1');

      expect(result.success).toBe(true);
      expect(result.data?.productId).toBe('prod-1');
      expect(result.data?.quantity).toBe(100);
      expect(result.data?.reservedQuantity).toBe(10);
      expect(result.data?.reorderLevel).toBe(20);
      expect(result.data?.lastUpdated).toBeInstanceOf(Date);
    });
  });
});
