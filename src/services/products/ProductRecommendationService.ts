// Product Recommendation Service
// Following Single Responsibility Principle - only handles product recommendations

import { injectable, inject } from 'tsyringe';
import type { IProductRepository } from '@/interfaces';
import { Product, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';

export interface IProductRecommendationService {
  getRecommendations(productId: string, limit?: number): Promise<ApiResponse<Product[]>>;
  getSimilarProducts(productId: string, limit?: number): Promise<ApiResponse<Product[]>>;
  getTrendingProducts(limit?: number): Promise<ApiResponse<Product[]>>;
}

@injectable()
export class ProductRecommendationService implements IProductRecommendationService {
  constructor(
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository
  ) {}

  async getRecommendations(productId: string, limit: number = 4): Promise<ApiResponse<Product[]>> {
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

      return await this.productRepository.findAll({
        category: product.category,
        excludeId: productId,
        limit,
        inStock: true,
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to get product recommendations: ${error}`,
      };
    }
  }

  async getSimilarProducts(productId: string, limit: number = 4): Promise<ApiResponse<Product[]>> {
    try {
      const productResult = await this.productRepository.findById(productId);

      if (!productResult.success || !productResult.data) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      const product = productResult.data;
      const priceRange = product.price * 0.2;

      return await this.productRepository.findAll({
        category: product.category,
        excludeId: productId,
        minPrice: Math.max(0, product.price - priceRange),
        maxPrice: product.price + priceRange,
        limit,
        inStock: true,
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to get similar products: ${error}`,
      };
    }
  }

  async getTrendingProducts(limit: number = 8): Promise<ApiResponse<Product[]>> {
    try {
      const featuredResult = await this.productRepository.findFeatured(limit);

      if (featuredResult.success && featuredResult.data && featuredResult.data.length > 0) {
        return featuredResult;
      }

      // Fall back to in-stock products if no featured products are configured
      return await this.productRepository.findAll({ limit, inStock: true });
    } catch (error) {
      return {
        success: false,
        error: `Failed to get trending products: ${error}`,
      };
    }
  }
}
