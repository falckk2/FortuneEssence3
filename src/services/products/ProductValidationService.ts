// Product Validation Service
// Following Single Responsibility Principle - only handles product validation

import { injectable, inject } from 'tsyringe';
import { IProductRepository } from '@/interfaces/repositories';
import { Product, ApiResponse } from '@/types';
import { TOKENS } from '@/config/di-container';

export interface IProductValidationService {
  validateAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>>;
  validateProductData(product: Partial<Product>): Promise<ApiResponse<boolean>>;
  checkStockLevel(productId: string): Promise<ApiResponse<{ available: boolean; stock: number }>>;
}

@injectable()
export class ProductValidationService implements IProductValidationService {
  constructor(
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository
  ) {}

  async validateAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>> {
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

  async validateProductData(product: Partial<Product>): Promise<ApiResponse<boolean>> {
    try {
      const errors: string[] = [];

      // Validate required fields
      if (product.price !== undefined && product.price < 0) {
        errors.push('Price cannot be negative');
      }

      if (product.stock !== undefined && product.stock < 0) {
        errors.push('Stock cannot be negative');
      }

      if (product.weight !== undefined && product.weight <= 0) {
        errors.push('Weight must be greater than 0');
      }

      if (product.sku && !/^[A-Z0-9-]+$/.test(product.sku)) {
        errors.push('SKU must contain only uppercase letters, numbers, and hyphens');
      }

      if (product.images && product.images.length === 0) {
        errors.push('At least one product image is required');
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join(', '),
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate product data: ${error}`,
      };
    }
  }

  async checkStockLevel(productId: string): Promise<ApiResponse<{ available: boolean; stock: number }>> {
    try {
      const result = await this.productRepository.findById(productId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      const product = result.data;

      return {
        success: true,
        data: {
          available: product.isActive && product.stock > 0,
          stock: product.stock,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to check stock level: ${error}`,
      };
    }
  }
}
