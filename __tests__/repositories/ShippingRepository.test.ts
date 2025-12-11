import { ShippingRepository } from '@/repositories/shipping/ShippingRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError, mockSupabaseNotFound } from '../helpers/mockSupabase';
import type { ShippingRate } from '@/types';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

describe('ShippingRepository', () => {
  let repository: ShippingRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockDbShippingRate = {
    id: 'ship-1',
    name: 'Standard Shipping',
    description: 'Delivery in 3-5 business days',
    price: 49,
    estimated_days: 4,
    country: 'Sweden',
    max_weight: 5,
  };

  const mockShippingRate: ShippingRate = {
    id: 'ship-1',
    name: 'Standard Shipping',
    description: 'Delivery in 3-5 business days',
    price: 49,
    estimatedDays: 4,
    country: 'Sweden',
    maxWeight: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const supabaseModule = require('@/lib/supabase');
    supabaseModule.supabase = mockSupabase;
    repository = new ShippingRepository();
  });

  describe('findRatesByCountry', () => {
    it('should return shipping rates for a country', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbShippingRate])
      );

      const result = await repository.findRatesByCountry('Sweden');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].country).toBe('Sweden');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('country', 'Sweden');
      expect(mockSupabase.mockQuery.order).toHaveBeenCalledWith('price', { ascending: true });
    });

    it('should return empty array when no rates found', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([])
      );

      const result = await repository.findRatesByCountry('Unknown');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.findRatesByCountry('Sweden');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('findById', () => {
    it('should return shipping rate by id', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbShippingRate)
      );

      const result = await repository.findById('ship-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('ship-1');
      expect(result.data?.name).toBe('Standard Shipping');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'ship-1');
    });

    it('should return error when shipping rate not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Shipping rate not found');
    });
  });

  describe('calculateShipping', () => {
    it('should return cheapest shipping rate for weight and country', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbShippingRate)
      );

      const result = await repository.calculateShipping(3, 'Sweden');

      expect(result.success).toBe(true);
      expect(result.data?.price).toBe(49);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('country', 'Sweden');
      expect(mockSupabase.mockQuery.gte).toHaveBeenCalledWith('max_weight', 3);
      expect(mockSupabase.mockQuery.limit).toHaveBeenCalledWith(1);
    });

    it('should return error when no shipping option available', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.calculateShipping(100, 'Sweden');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No shipping option available for this weight and destination');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.calculateShipping(3, 'Sweden');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('create', () => {
    it('should create new shipping rate', async () => {
      const newRate = {
        name: 'Express Shipping',
        description: 'Next day delivery',
        price: 99,
        estimatedDays: 1,
        country: 'Sweden',
        maxWeight: 2,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({
          ...mockDbShippingRate,
          ...newRate,
          estimated_days: 1,
          max_weight: 2,
        })
      );

      const result = await repository.create(newRate);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Express Shipping');
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const newRate = {
        name: 'Express Shipping',
        description: 'Next day delivery',
        price: 99,
        estimatedDays: 1,
        country: 'Sweden',
        maxWeight: 2,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Insert failed')
      );

      const result = await repository.create(newRate);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insert failed');
    });
  });

  describe('update', () => {
    it('should update shipping rate successfully', async () => {
      const updates = {
        price: 59,
        estimatedDays: 3,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({
          ...mockDbShippingRate,
          price: 59,
          estimated_days: 3,
        })
      );

      const result = await repository.update('ship-1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.price).toBe(59);
      expect(result.data?.estimatedDays).toBe(3);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'ship-1');
    });

    it('should return error when shipping rate not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.update('nonexistent', { price: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Shipping rate not found');
    });
  });

  describe('delete', () => {
    it('should delete shipping rate successfully', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.delete('ship-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.delete).toHaveBeenCalled();
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'ship-1');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseError('Delete failed')
      );

      const result = await repository.delete('ship-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delete failed');
    });
  });

  describe('getAllCountries', () => {
    it('should return unique list of countries', async () => {
      const mockCountryData = [
        { country: 'Sweden' },
        { country: 'Norway' },
        { country: 'Sweden' },
        { country: 'Denmark' },
      ];

      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockCountryData)
      );

      const result = await repository.getAllCountries();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['Sweden', 'Norway', 'Denmark']);
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.getAllCountries();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('getFreeShippingThreshold', () => {
    it('should return threshold for country with free shipping', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({ ...mockDbShippingRate, price: 0 })
      );

      const result = await repository.getFreeShippingThreshold('Sweden');

      expect(result.success).toBe(true);
      expect(result.data).toBe(500); // Default for Sweden
    });

    it('should return null when no free shipping available', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.getFreeShippingThreshold('Norway');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getEstimatedDeliveryDate', () => {
    it('should calculate delivery date based on shipping rate', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbShippingRate)
      );

      const result = await repository.getEstimatedDeliveryDate('ship-1');

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Date);
    });

    it('should skip weekends in delivery estimate', async () => {
      const fridayRate = { ...mockDbShippingRate, estimated_days: 3 };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(fridayRate)
      );

      const result = await repository.getEstimatedDeliveryDate('ship-1');

      expect(result.success).toBe(true);
      const dayOfWeek = result.data?.getDay();
      expect(dayOfWeek).not.toBe(0); // Not Sunday
      expect(dayOfWeek).not.toBe(6); // Not Saturday
    });

    it('should return error when shipping rate not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.getEstimatedDeliveryDate('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Shipping rate not found');
    });
  });

  describe('validateShippingToAddress', () => {
    it('should return true when shipping available for weight', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbShippingRate])
      );

      const result = await repository.validateShippingToAddress('Sweden', 3);

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when no shipping available for weight', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([{ ...mockDbShippingRate, max_weight: 2 }])
      );

      const result = await repository.validateShippingToAddress('Sweden', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('data transformation', () => {
    it('should correctly transform database record to domain model', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbShippingRate)
      );

      const result = await repository.findById('ship-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('ship-1');
      expect(result.data?.name).toBe('Standard Shipping');
      expect(result.data?.description).toBe('Delivery in 3-5 business days');
      expect(result.data?.price).toBe(49);
      expect(result.data?.estimatedDays).toBe(4);
      expect(result.data?.country).toBe('Sweden');
      expect(result.data?.maxWeight).toBe(5);
    });
  });
});
