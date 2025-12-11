import { ProductRepository } from '@/repositories/products/ProductRepository';
import { createMockSupabaseClient, mockSupabaseSuccess, mockSupabaseError, mockSupabaseNotFound } from '../helpers/mockSupabase';
import type { Product, ProductSearchParams } from '@/types';
import { TOKENS } from '@/config/di-container';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: null,
}));

// Mock tsyringe
jest.mock('tsyringe', () => ({
  injectable: () => (target: any) => target,
  inject: () => (target: any, propertyKey: string, parameterIndex: number) => {},
}));

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  const mockDbProduct = {
    id: 'prod-1',
    name: 'Lavender Essential Oil',
    description: 'Premium organic lavender oil',
    price: 299.99,
    category: 'essential-oils',
    images: ['lavender.jpg'],
    stock: 50,
    sku: 'LAV-001',
    weight: 0.1,
    length: 5,
    width: 5,
    height: 10,
    is_active: true,
    name_sv: 'Lavendel Eterisk Olja',
    description_sv: 'Premium ekologisk lavendelolja',
    name_en: 'Lavender Essential Oil',
    description_en: 'Premium organic lavender oil',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockProduct: Product = {
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
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    repository = new ProductRepository(mockSupabase as any);
  });

  describe('findAll', () => {
    it('should return all active products', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].id).toBe('prod-1');
      expect(mockSupabase.from).toHaveBeenCalledWith('products');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should filter products by category', async () => {
      const params: ProductSearchParams = { category: 'essential-oils' };
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findAll(params);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('category', 'essential-oils');
    });

    it('should filter products by price range', async () => {
      const params: ProductSearchParams = { minPrice: 100, maxPrice: 500 };
      mockSupabase.mockQuery.gte = jest.fn().mockReturnThis();
      mockSupabase.mockQuery.lte = jest.fn().mockReturnThis();
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findAll(params);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.gte).toHaveBeenCalledWith('price', 100);
      expect(mockSupabase.mockQuery.lte).toHaveBeenCalledWith('price', 500);
    });

    it('should filter products in stock', async () => {
      const params: ProductSearchParams = { inStock: true };
      mockSupabase.mockQuery.gt = jest.fn().mockReturnThis();
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findAll(params);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.gt).toHaveBeenCalledWith('stock', 0);
    });

    it('should search products by name/description in English', async () => {
      const params: ProductSearchParams = { search: 'lavender', locale: 'en' };
      mockSupabase.mockQuery.or = jest.fn().mockReturnThis();
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findAll(params);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.or).toHaveBeenCalled();
    });

    it('should return mock data on database error', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Database connection failed')
      );

      const result = await repository.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should return product by id', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbProduct)
      );

      const result = await repository.findById('prod-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('prod-1');
      expect(result.data?.name).toBe('Lavender Essential Oil');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'prod-1');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should return error when product not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.findById('nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Connection timeout')
      );

      const result = await repository.findById('prod-1');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('findByCategory', () => {
    it('should return products by category', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findByCategory('essential-oils');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('category', 'essential-oils');
    });

    it('should return error on database failure', async () => {
      mockSupabase.mockQuery.order = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.findByCategory('essential-oils');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Query failed');
    });
  });

  describe('findBySku', () => {
    it('should return product by SKU', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbProduct)
      );

      const result = await repository.findBySku('LAV-001');

      expect(result.success).toBe(true);
      expect(result.data?.sku).toBe('LAV-001');
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('sku', 'LAV-001');
    });

    it('should return error when SKU not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseNotFound()
      );

      const result = await repository.findBySku('INVALID-SKU');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });

  describe('findFeatured', () => {
    it('should return featured products with default limit', async () => {
      mockSupabase.mockQuery.limit = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findFeatured();

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.limit).toHaveBeenCalledWith(8);
    });

    it('should return featured products with custom limit', async () => {
      mockSupabase.mockQuery.limit = jest.fn().mockResolvedValue(
        mockSupabaseSuccess([mockDbProduct])
      );

      const result = await repository.findFeatured(5);

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.limit).toHaveBeenCalledWith(5);
    });

    it('should return mock data on database error', async () => {
      mockSupabase.mockQuery.limit = jest.fn().mockResolvedValue(
        mockSupabaseError('Database error')
      );

      const result = await repository.findFeatured();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getCategories', () => {
    it('should return category list with counts', async () => {
      const mockCategoryData = [
        { category: 'essential-oils' },
        { category: 'essential-oils' },
        { category: 'carrier-oils' },
      ];

      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockCategoryData)
      );

      const result = await repository.getCategories();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBe(2);
      expect(result.data?.find(c => c.category === 'essential-oils')?.count).toBe(2);
      expect(result.data?.find(c => c.category === 'carrier-oils')?.count).toBe(1);
    });

    it('should return error on database failure', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseError('Query failed')
      );

      const result = await repository.getCategories();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a new product successfully', async () => {
      const newProduct = {
        name: 'Rose Oil',
        description: 'Premium rose oil',
        price: 399.99,
        category: 'essential-oils' as const,
        images: ['rose.jpg'],
        stock: 30,
        sku: 'ROSE-001',
        weight: 0.15,
        dimensions: { length: 5, width: 5, height: 10 },
        isActive: true,
        translations: {
          sv: { name: 'Ros Olja', description: 'Premium rosolja' },
          en: { name: 'Rose Oil', description: 'Premium rose oil' },
        },
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({ ...mockDbProduct, ...newProduct })
      );

      const result = await repository.create(newProduct);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Rose Oil');
      expect(mockSupabase.mockQuery.insert).toHaveBeenCalled();
    });

    it('should return error when SKU already exists', async () => {
      const newProduct = {
        name: 'Rose Oil',
        description: 'Premium rose oil',
        price: 399.99,
        category: 'essential-oils' as const,
        images: ['rose.jpg'],
        stock: 30,
        sku: 'LAV-001',
        weight: 0.15,
        dimensions: { length: 5, width: 5, height: 10 },
        isActive: true,
        translations: {
          sv: { name: 'Ros Olja', description: 'Premium rosolja' },
          en: { name: 'Rose Oil', description: 'Premium rose oil' },
        },
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Duplicate key', '23505')
      );

      const result = await repository.create(newProduct);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product with this SKU already exists');
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updates = {
        price: 349.99,
        stock: 75,
      };

      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess({ ...mockDbProduct, price: 349.99, stock: 75 })
      );

      const result = await repository.update('prod-1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.price).toBe(349.99);
      expect(result.data?.stock).toBe(75);
      expect(mockSupabase.mockQuery.update).toHaveBeenCalled();
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'prod-1');
    });

    it('should return error when product not found', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.update('nonexistent', { price: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseError('Update failed')
      );

      const result = await repository.update('prod-1', { price: 100 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update failed');
    });
  });

  describe('delete', () => {
    it('should soft delete product by setting is_active to false', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(null)
      );

      const result = await repository.delete('prod-1');

      expect(result.success).toBe(true);
      expect(mockSupabase.mockQuery.update).toHaveBeenCalledWith({ is_active: false });
      expect(mockSupabase.mockQuery.eq).toHaveBeenCalledWith('id', 'prod-1');
    });

    it('should handle database errors', async () => {
      mockSupabase.mockQuery.eq = jest.fn().mockResolvedValue(
        mockSupabaseError('Delete failed')
      );

      const result = await repository.delete('prod-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delete failed');
    });
  });

  describe('data transformation', () => {
    it('should correctly transform database record to domain model', async () => {
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(mockDbProduct)
      );

      const result = await repository.findById('prod-1');

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('prod-1');
      expect(result.data?.isActive).toBe(true);
      expect(result.data?.dimensions).toEqual({ length: 5, width: 5, height: 10 });
      expect(result.data?.translations.sv.name).toBe('Lavendel Eterisk Olja');
      expect(result.data?.createdAt).toBeInstanceOf(Date);
      expect(result.data?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle empty images array', async () => {
      const productWithoutImages = { ...mockDbProduct, images: [] };
      mockSupabase.mockQuery.single = jest.fn().mockResolvedValue(
        mockSupabaseSuccess(productWithoutImages)
      );

      const result = await repository.findById('prod-1');

      expect(result.success).toBe(true);
      expect(result.data?.images).toEqual([]);
    });
  });
});
