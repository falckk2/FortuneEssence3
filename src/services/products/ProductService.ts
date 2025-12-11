import { injectable, inject } from 'tsyringe';
import type { IProductService, IProductRepository } from '@/interfaces';
import { ProductSearchParams } from '@/interfaces';
import { Product, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';
import { CategoryService } from '@/config/categories';

@injectable()
export class ProductService implements IProductService {
  constructor(
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository,
    @inject(TOKENS.CategoryService) private readonly categoryService: CategoryService
  ) {}

  async getProducts(params?: ProductSearchParams): Promise<ApiResponse<Product[]>> {
    try {
      const result = await this.productRepository.findAll(params);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get products: ${error}`,
      };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const result = await this.productRepository.findById(id);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get product: ${error}`,
      };
    }
  }

  async searchProducts(query: string, locale: string): Promise<ApiResponse<Product[]>> {
    try {
      const searchParams: ProductSearchParams = {
        search: query,
        locale,
        inStock: true, // Only show products in stock for search results
      };

      const result = await this.productRepository.findAll(searchParams);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to search products: ${error}`,
      };
    }
  }

  async getProductsByCategory(category: string): Promise<ApiResponse<Product[]>> {
    try {
      const result = await this.productRepository.findByCategory(category);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get products by category: ${error}`,
      };
    }
  }

  async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    try {
      const result = await this.productRepository.findFeatured(8);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get featured products: ${error}`,
      };
    }
  }

  // Additional business logic methods
  async getProductWithLocalization(id: string, locale: 'sv' | 'en'): Promise<ApiResponse<Product & { localizedName: string; localizedDescription: string }>> {
    try {
      const result = await this.productRepository.findById(id);
      
      if (!result.success || !result.data) {
        return result as any;
      }

      const product = result.data;
      const localized = {
        ...product,
        localizedName: product.translations[locale].name,
        localizedDescription: product.translations[locale].description,
      };

      return {
        success: true,
        data: localized,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get localized product: ${error}`,
      };
    }
  }

  async getProductRecommendations(productId: string, limit: number = 4): Promise<ApiResponse<Product[]>> {
    try {
      // Get the current product to find similar products
      const productResult = await this.productRepository.findById(productId);
      
      if (!productResult.success || !productResult.data) {
        return {
          success: false,
          error: 'Product not found for recommendations',
        };
      }

      const product = productResult.data;

      // Find products in the same category
      const categoryResult = await this.productRepository.findByCategory(product.category);
      
      if (!categoryResult.success) {
        return categoryResult;
      }

      // Filter out the current product and limit results
      const recommendations = categoryResult.data!
        .filter(p => p.id !== productId)
        .slice(0, limit);

      return {
        success: true,
        data: recommendations,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get product recommendations: ${error}`,
      };
    }
  }

  async getProductsWithFilters(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'name' | 'price' | 'created';
    sortOrder?: 'asc' | 'desc';
    locale?: 'sv' | 'en';
  }): Promise<ApiResponse<Product[]>> {
    try {
      const params: ProductSearchParams = {
        category: filters.category,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        inStock: filters.inStock,
        locale: filters.locale,
      };

      const result = await this.productRepository.findAll(params);

      if (!result.success) {
        return result;
      }

      let products = result.data!;

      // Apply sorting
      if (filters.sortBy) {
        products.sort((a, b) => {
          let valueA: any;
          let valueB: any;

          switch (filters.sortBy) {
            case 'name':
              valueA = filters.locale === 'sv' ? a.translations.sv.name : a.translations.en.name;
              valueB = filters.locale === 'sv' ? b.translations.sv.name : b.translations.en.name;
              break;
            case 'price':
              valueA = a.price;
              valueB = b.price;
              break;
            case 'created':
              valueA = a.createdAt;
              valueB = b.createdAt;
              break;
            default:
              valueA = a.name;
              valueB = b.name;
          }

          if (filters.sortOrder === 'desc') {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
          } else {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
          }
        });
      }

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get filtered products: ${error}`,
      };
    }
  }

  async getProductCategories(): Promise<ApiResponse<{ category: string; count: number; displayName: { sv: string; en: string } }[]>> {
    try {
      const result = await this.productRepository.getCategories();
      
      if (!result.success) {
        return result as any;
      }

      // Add localized display names for categories
      const categoriesWithNames = result.data!.map(cat => ({
        ...cat,
        displayName: this.getCategoryDisplayName(cat.category),
      }));

      return {
        success: true,
        data: categoriesWithNames,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get product categories: ${error}`,
      };
    }
  }

  private getCategoryDisplayName(category: string): { sv: string; en: string } {
    return this.categoryService.getCategoryDisplayName(category);
  }

  async validateProductAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.productRepository.findById(productId);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      const product = result.data;
      const isAvailable = product.isActive && product.stock >= quantity;

      return {
        success: true,
        data: isAvailable,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate product availability: ${error}`,
      };
    }
  }

  async getProductsBySku(skus: string[]): Promise<ApiResponse<Product[]>> {
    try {
      const products: Product[] = [];
      
      for (const sku of skus) {
        const result = await this.productRepository.findBySku(sku);
        if (result.success && result.data) {
          products.push(result.data);
        }
      }

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get products by SKU: ${error}`,
      };
    }
  }
}