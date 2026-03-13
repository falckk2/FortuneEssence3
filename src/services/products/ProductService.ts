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
      return await this.productRepository.findAll(params);
    } catch (error) {
      return { success: false, error: `Failed to get products: ${error}` };
    }
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      return await this.productRepository.findById(id);
    } catch (error) {
      return { success: false, error: `Failed to get product: ${error}` };
    }
  }

  async searchProducts(query: string, locale: string): Promise<ApiResponse<Product[]>> {
    try {
      const searchParams: ProductSearchParams = {
        search: query,
        locale,
        inStock: true, // Only show products in stock for search results
      };
      return await this.productRepository.findAll(searchParams);
    } catch (error) {
      return { success: false, error: `Failed to search products: ${error}` };
    }
  }

  async getProductsByCategory(category: string): Promise<ApiResponse<Product[]>> {
    try {
      return await this.productRepository.findByCategory(category);
    } catch (error) {
      return { success: false, error: `Failed to get products by category: ${error}` };
    }
  }

  async getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
    try {
      return await this.productRepository.findFeatured(8);
    } catch (error) {
      return { success: false, error: `Failed to get featured products: ${error}` };
    }
  }

  // Additional business logic methods
  async getProductWithLocalization(id: string, locale: 'sv' | 'en'): Promise<ApiResponse<Product & { localizedName: string; localizedDescription: string }>> {
    try {
      const result = await this.productRepository.findById(id);

      if (!result.success || !result.data) {
        return { success: false, error: result.error ?? 'Product not found' };
      }

      const product = result.data;
      const translation = product.translations[locale];

      if (!translation) {
        return { success: false, error: `No translation available for locale '${locale}'` };
      }

      return {
        success: true,
        data: {
          ...product,
          localizedName: translation.name,
          localizedDescription: translation.description,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get localized product: ${error}`,
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
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      const result = await this.productRepository.findAll(params);

      if (!result.success || !result.data || !filters.sortBy) {
        return result;
      }

      const sorted = [...result.data].sort((a, b) => {
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        switch (filters.sortBy) {
          case 'price':
            return (a.price - b.price) * order;
          case 'name': {
            const locale = filters.locale ?? 'en';
            const nameA = a.translations?.[locale]?.name ?? a.name ?? '';
            const nameB = b.translations?.[locale]?.name ?? b.name ?? '';
            return nameA.localeCompare(nameB, locale === 'sv' ? 'sv' : 'en') * order;
          }
          case 'created':
            return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
          default:
            return 0;
        }
      });

      return { success: true, data: sorted };
    } catch (error) {
      return { success: false, error: `Failed to get products with filters: ${error}` };
    }
  }

  async getProductCategories(): Promise<ApiResponse<{ category: string; count: number; displayName: { sv: string; en: string } }[]>> {
    try {
      const result = await this.productRepository.getCategories();

      if (!result.success) {
        return { success: false, error: result.error ?? 'Failed to get categories' };
      }

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
      if (skus.length === 0) {
        return { success: true, data: [] };
      }
      const results = await Promise.all(skus.map(sku => this.productRepository.findBySku(sku)));
      const products = results
        .filter(r => r.success && r.data)
        .map(r => r.data!);
      return { success: true, data: products };
    } catch (error) {
      return { success: false, error: `Failed to get products by SKU: ${error}` };
    }
  }

  async getProductRecommendations(productId: string, limit = 4): Promise<ApiResponse<Product[]>> {
    try {
      const productResult = await this.productRepository.findById(productId);
      if (!productResult.success || !productResult.data) {
        return { success: false, error: 'Product not found for recommendations' };
      }
      const category = productResult.data.category;
      const categoryResult = await this.productRepository.findByCategory(category);
      if (!categoryResult.success) {
        return { success: false, error: categoryResult.error ?? 'Failed to get recommendations' };
      }
      const recommendations = (categoryResult.data ?? [])
        .filter(p => p.id !== productId)
        .slice(0, limit);
      return { success: true, data: recommendations };
    } catch (error) {
      return { success: false, error: `Failed to get product recommendations: ${error}` };
    }
  }
}
