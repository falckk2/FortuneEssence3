import 'reflect-metadata';
import { ProductService } from '@/services/products/ProductService';
import { IProductRepository } from '@/interfaces';
import { Product, ApiResponse } from '@/types';
import { ProductSearchParams } from '@/interfaces';

// Mock CategoryService
const mockCategoryService = {
  getCategoryDisplayName: jest.fn((category: string) => ({
    sv: `${category} (sv)`,
    en: `${category} (en)`,
  })),
};

describe('ProductService', () => {
  let productService: ProductService;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'Test Description',
    price: 299.99,
    category: 'wellness',
    images: ['image1.jpg'],
    stock: 50,
    sku: 'TEST-001',
    weight: 0.5,
    dimensions: { length: 10, width: 5, height: 3 },
    isActive: true,
    translations: {
      sv: {
        name: 'Testprodukt',
        description: 'Testbeskrivning',
      },
      en: {
        name: 'Test Product',
        description: 'Test Description',
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const mockProducts: Product[] = [
    mockProduct,
    {
      ...mockProduct,
      id: 'prod-2',
      name: 'Another Product',
      price: 199.99,
      stock: 30,
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock repository
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCategory: jest.fn(),
      findFeatured: jest.fn(),
      findBySku: jest.fn(),
      getCategories: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    // Instantiate service with mocks
    productService = new ProductService(mockProductRepository, mockCategoryService as any);
  });

  describe('getProducts', () => {
    it('should return all products successfully', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProducts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(undefined);
    });

    it('should pass search parameters to repository', async () => {
      // Arrange
      const params: ProductSearchParams = {
        category: 'wellness',
        minPrice: 100,
        maxPrice: 500,
        inStock: true,
        locale: 'sv',
      };
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProducts(params);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(params);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      mockProductRepository.findAll.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await productService.getProducts();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get products');
    });
  });

  describe('getProduct', () => {
    it('should return a single product by ID', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProduct('prod-1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProduct);
      expect(mockProductRepository.findById).toHaveBeenCalledWith('prod-1');
    });

    it('should handle product not found', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: false,
        error: 'Product not found',
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProduct('non-existent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });

    it('should handle repository errors', async () => {
      // Arrange
      mockProductRepository.findById.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await productService.getProduct('prod-1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get product');
    });
  });

  describe('searchProducts', () => {
    it('should search products with query and locale', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.searchProducts('test', 'sv');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith({
        search: 'test',
        locale: 'sv',
        inStock: true,
      });
    });

    it('should only return in-stock products for search results', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      await productService.searchProducts('wellness', 'en');

      // Assert
      const callParams = mockProductRepository.findAll.mock.calls[0][0];
      expect(callParams?.inStock).toBe(true);
    });

    it('should handle search errors', async () => {
      // Arrange
      mockProductRepository.findAll.mockRejectedValue(new Error('Search error'));

      // Act
      const result = await productService.searchProducts('test', 'sv');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to search products');
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products in a specific category', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findByCategory.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductsByCategory('wellness');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(mockProductRepository.findByCategory).toHaveBeenCalledWith('wellness');
    });

    it('should handle category not found', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product[]> = {
        success: false,
        error: 'Category not found',
      };
      mockProductRepository.findByCategory.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductsByCategory('non-existent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Category not found');
    });
  });

  describe('getFeaturedProducts', () => {
    it('should return featured products', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findFeatured.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getFeaturedProducts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProducts);
      expect(mockProductRepository.findFeatured).toHaveBeenCalledWith(8);
    });

    it('should handle errors getting featured products', async () => {
      // Arrange
      mockProductRepository.findFeatured.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await productService.getFeaturedProducts();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get featured products');
    });
  });

  describe('getProductWithLocalization', () => {
    it('should return product with Swedish localization', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductWithLocalization('prod-1', 'sv');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.localizedName).toBe('Testprodukt');
      expect(result.data?.localizedDescription).toBe('Testbeskrivning');
    });

    it('should return product with English localization', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductWithLocalization('prod-1', 'en');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.localizedName).toBe('Test Product');
      expect(result.data?.localizedDescription).toBe('Test Description');
    });

    it('should handle product not found for localization', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: false,
        error: 'Product not found',
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductWithLocalization('non-existent', 'sv');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });

  describe('getProductRecommendations', () => {
    it('should return product recommendations from the same category', async () => {
      // Arrange
      const productResponse: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      const categoryResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findById.mockResolvedValue(productResponse);
      mockProductRepository.findByCategory.mockResolvedValue(categoryResponse);

      // Act
      const result = await productService.getProductRecommendations('prod-1', 4);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // Should exclude the current product
      expect(result.data?.some(p => p.id === 'prod-1')).toBe(false);
      expect(mockProductRepository.findByCategory).toHaveBeenCalledWith('wellness');
    });

    it('should limit recommendations to specified number', async () => {
      // Arrange
      const manyProducts = [
        ...mockProducts,
        { ...mockProduct, id: 'prod-3' },
        { ...mockProduct, id: 'prod-4' },
        { ...mockProduct, id: 'prod-5' },
      ];
      const productResponse: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      const categoryResponse: ApiResponse<Product[]> = {
        success: true,
        data: manyProducts,
      };
      mockProductRepository.findById.mockResolvedValue(productResponse);
      mockProductRepository.findByCategory.mockResolvedValue(categoryResponse);

      // Act
      const result = await productService.getProductRecommendations('prod-1', 2);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(2);
    });

    it('should handle product not found for recommendations', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: false,
        error: 'Product not found',
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductRecommendations('non-existent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found for recommendations');
    });
  });

  describe('getProductsWithFilters', () => {
    it('should apply filters and return products', async () => {
      // Arrange
      const filters = {
        category: 'wellness',
        minPrice: 100,
        maxPrice: 500,
        inStock: true,
        locale: 'sv' as const,
      };
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: mockProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductsWithFilters(filters);

      // Assert
      expect(result.success).toBe(true);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith({
        category: 'wellness',
        minPrice: 100,
        maxPrice: 500,
        inStock: true,
        locale: 'sv',
      });
    });

    it('should sort products by price ascending', async () => {
      // Arrange
      const unsortedProducts = [
        { ...mockProduct, id: 'prod-1', price: 299.99 },
        { ...mockProduct, id: 'prod-2', price: 99.99 },
        { ...mockProduct, id: 'prod-3', price: 199.99 },
      ];
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: unsortedProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductsWithFilters({
        sortBy: 'price',
        sortOrder: 'asc',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data![0].price).toBe(99.99);
      expect(result.data![1].price).toBe(199.99);
      expect(result.data![2].price).toBe(299.99);
    });

    it('should sort products by price descending', async () => {
      // Arrange
      const unsortedProducts = [
        { ...mockProduct, id: 'prod-1', price: 199.99 },
        { ...mockProduct, id: 'prod-2', price: 99.99 },
        { ...mockProduct, id: 'prod-3', price: 299.99 },
      ];
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: unsortedProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductsWithFilters({
        sortBy: 'price',
        sortOrder: 'desc',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data![0].price).toBe(299.99);
      expect(result.data![2].price).toBe(99.99);
    });

    it('should sort products by name with Swedish locale', async () => {
      // Arrange
      const unsortedProducts = [
        { ...mockProduct, id: 'prod-1', translations: { sv: { name: 'Produkt C', description: '' }, en: { name: 'Product C', description: '' } } },
        { ...mockProduct, id: 'prod-2', translations: { sv: { name: 'Produkt A', description: '' }, en: { name: 'Product A', description: '' } } },
        { ...mockProduct, id: 'prod-3', translations: { sv: { name: 'Produkt B', description: '' }, en: { name: 'Product B', description: '' } } },
      ];
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: unsortedProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductsWithFilters({
        sortBy: 'name',
        sortOrder: 'asc',
        locale: 'sv',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data![0].translations.sv.name).toBe('Produkt A');
      expect(result.data![1].translations.sv.name).toBe('Produkt B');
      expect(result.data![2].translations.sv.name).toBe('Produkt C');
    });

    it('should sort products by created date', async () => {
      // Arrange
      const unsortedProducts = [
        { ...mockProduct, id: 'prod-1', createdAt: new Date('2024-01-03') },
        { ...mockProduct, id: 'prod-2', createdAt: new Date('2024-01-01') },
        { ...mockProduct, id: 'prod-3', createdAt: new Date('2024-01-02') },
      ];
      const mockResponse: ApiResponse<Product[]> = {
        success: true,
        data: unsortedProducts,
      };
      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductsWithFilters({
        sortBy: 'created',
        sortOrder: 'asc',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data![0].createdAt.toISOString()).toBe(new Date('2024-01-01').toISOString());
    });
  });

  describe('getProductCategories', () => {
    it('should return categories with localized display names', async () => {
      // Arrange
      const mockCategoriesResponse: ApiResponse<Array<{ category: string; count: number }>> = {
        success: true,
        data: [
          { category: 'wellness', count: 10 },
          { category: 'skincare', count: 5 },
        ],
      };
      mockProductRepository.getCategories.mockResolvedValue(mockCategoriesResponse);

      // Act
      const result = await productService.getProductCategories();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual({
        category: 'wellness',
        count: 10,
        displayName: { sv: 'wellness (sv)', en: 'wellness (en)' },
      });
      expect(mockCategoryService.getCategoryDisplayName).toHaveBeenCalledWith('wellness');
      expect(mockCategoryService.getCategoryDisplayName).toHaveBeenCalledWith('skincare');
    });

    it('should handle errors getting categories', async () => {
      // Arrange
      const mockResponse: ApiResponse<Array<{ category: string; count: number }>> = {
        success: false,
        error: 'Database error',
      };
      mockProductRepository.getCategories.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.getProductCategories();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });

  describe('validateProductAvailability', () => {
    it('should return true when product is available in sufficient quantity', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.validateProductAvailability('prod-1', 10);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false when product stock is insufficient', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: { ...mockProduct, stock: 5 },
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.validateProductAvailability('prod-1', 10);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should return false when product is not active', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: true,
        data: { ...mockProduct, isActive: false },
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.validateProductAvailability('prod-1', 10);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should handle product not found', async () => {
      // Arrange
      const mockResponse: ApiResponse<Product> = {
        success: false,
        error: 'Product not found',
      };
      mockProductRepository.findById.mockResolvedValue(mockResponse);

      // Act
      const result = await productService.validateProductAvailability('non-existent', 10);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });

  describe('getProductsBySku', () => {
    it('should return products by multiple SKUs', async () => {
      // Arrange
      const skus = ['TEST-001', 'TEST-002'];
      const product1Response: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      const product2Response: ApiResponse<Product> = {
        success: true,
        data: { ...mockProduct, id: 'prod-2', sku: 'TEST-002' },
      };
      mockProductRepository.findBySku
        .mockResolvedValueOnce(product1Response)
        .mockResolvedValueOnce(product2Response);

      // Act
      const result = await productService.getProductsBySku(skus);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockProductRepository.findBySku).toHaveBeenCalledTimes(2);
      expect(mockProductRepository.findBySku).toHaveBeenCalledWith('TEST-001');
      expect(mockProductRepository.findBySku).toHaveBeenCalledWith('TEST-002');
    });

    it('should skip products not found by SKU', async () => {
      // Arrange
      const skus = ['TEST-001', 'NON-EXISTENT'];
      const product1Response: ApiResponse<Product> = {
        success: true,
        data: mockProduct,
      };
      const product2Response: ApiResponse<Product> = {
        success: false,
        error: 'Product not found',
      };
      mockProductRepository.findBySku
        .mockResolvedValueOnce(product1Response)
        .mockResolvedValueOnce(product2Response);

      // Act
      const result = await productService.getProductsBySku(skus);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].sku).toBe('TEST-001');
    });

    it('should handle errors getting products by SKU', async () => {
      // Arrange
      const skus = ['TEST-001'];
      mockProductRepository.findBySku.mockRejectedValue(new Error('Database error'));

      // Act
      const result = await productService.getProductsBySku(skus);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to get products by SKU');
    });

    it('should return empty array for empty SKU list', async () => {
      // Arrange
      const skus: string[] = [];

      // Act
      const result = await productService.getProductsBySku(skus);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});
