// Product Search and Filtering Service
// Following Single Responsibility Principle - only handles product search and filtering

import { injectable, inject } from 'tsyringe';
import type { IProductRepository } from '$lib/interfaces';
import { ProductSearchParams } from '$lib/interfaces';
import { Product, ApiResponse } from '$lib/types';
import { TOKENS } from '$lib/config/di-container';

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
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      return await this.productRepository.findAll(params);
    } catch (error) {
      return {
        success: false,
        error: `Failed to filter products: ${error}`,
      };
    }
  }

  async getByCategory(category: string): Promise<ApiResponse<Product[]>> {
    try {
      return await this.productRepository.findAll({ category, inStock: true });
    } catch (error) {
      return {
        success: false,
        error: `Failed to get products by category: ${error}`,
      };
    }
  }


}
