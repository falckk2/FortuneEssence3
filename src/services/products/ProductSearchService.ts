// Product Search and Filtering Service
// Following Single Responsibility Principle - only handles product search and filtering

import { injectable, inject } from 'tsyringe';
import type { IProductRepository } from '@/interfaces';
import { ProductSearchParams } from '@/interfaces';
import { Product, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';

export interface IProductSearchService {
  search(query: string, locale: string): Promise<ApiResponse<Product[]>>;
  filterProducts(filters: ProductFilterOptions): Promise<ApiResponse<Product[]>>;
  getByCategory(category: string): Promise<ApiResponse<Product[]>>;
}

export interface ProductFilterOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'created';
  sortOrder?: 'asc' | 'desc';
  locale?: 'sv' | 'en';
}

@injectable()
export class ProductSearchService implements IProductSearchService {
  constructor(
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository
  ) {}

  async search(query: string, locale: string): Promise<ApiResponse<Product[]>> {
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

  async filterProducts(filters: ProductFilterOptions): Promise<ApiResponse<Product[]>> {
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
        products = this.sortProducts(products, filters.sortBy, filters.sortOrder, filters.locale);
      }

      return {
        success: true,
        data: products,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to filter products: ${error}`,
      };
    }
  }

  async getByCategory(category: string): Promise<ApiResponse<Product[]>> {
    try {
      return await this.productRepository.findByCategory(category);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get products by category: ${error}`,
      };
    }
  }

  private sortProducts(
    products: Product[],
    sortBy: 'name' | 'price' | 'created',
    sortOrder: 'asc' | 'desc' = 'asc',
    locale?: 'sv' | 'en'
  ): Product[] {
    return products.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = locale === 'sv' ? a.translations.sv.name : a.translations.en.name;
          valueB = locale === 'sv' ? b.translations.sv.name : b.translations.en.name;
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

      if (sortOrder === 'desc') {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      } else {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      }
    });
  }
}
