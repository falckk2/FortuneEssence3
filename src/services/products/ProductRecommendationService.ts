// Product Recommendation Service
// Following Single Responsibility Principle - only handles product recommendations

import { injectable, inject } from 'tsyringe';
import { IProductRepository } from '@/interfaces/repositories';
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

      // Find products in the same category and similar price range
      const categoryResult = await this.productRepository.findByCategory(product.category);

      if (!categoryResult.success) {
        return categoryResult;
      }

      // Find products within 20% of the price
      const priceRange = product.price * 0.2;
      const similarProducts = categoryResult.data!
        .filter(p =>
          p.id !== productId &&
          p.price >= product.price - priceRange &&
          p.price <= product.price + priceRange
        )
        .slice(0, limit);

      return {
        success: true,
        data: similarProducts,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get similar products: ${error}`,
      };
    }
  }

  async getTrendingProducts(limit: number = 8): Promise<ApiResponse<Product[]>> {
    try {
      // For now, return featured products
      // In the future, this could be based on purchase history, views, etc.
      return await this.productRepository.findFeatured(limit);
    } catch (error) {
      return {
        success: false,
        error: `Failed to get trending products: ${error}`,
      };
    }
  }
}
