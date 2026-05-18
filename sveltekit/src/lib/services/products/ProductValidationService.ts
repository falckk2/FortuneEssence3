// Product Validation Service
// Following Single Responsibility Principle - only handles product validation

import { injectable, inject } from 'tsyringe';
import type { IProductRepository } from '$lib/interfaces';
import { Product, ApiResponse } from '$lib/types';
import { TOKENS } from '$lib/config/di-container';

export interface IProductValidationService {
  validateAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>>;
  validateProductData(product: Partial<Product>): ApiResponse<boolean>;
  checkStockLevel(productId: string): Promise<ApiResponse<{ available: boolean; stock: number }>>;
}

@injectable()
export class ProductValidationService implements IProductValidationService {
  constructor(
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository
  ) {}

  async validateAvailability(productId: string, quantity: number): Promise<ApiResponse<boolean>> {
    try {
      const stockResult = await this.checkStockLevel(productId);
      if (!stockResult.success || !stockResult.data) {
        return { success: false, error: stockResult.error ?? 'Product not found' };
      }
      if (!stockResult.data.available || stockResult.data.stock < quantity) {
        return { success: false, error: 'Insufficient stock' };
      }
      return { success: true, data: true };
    } catch (error) {
      return { success: false, error: `Failed to validate availability: ${error}` };
    }
  }

  validateProductData(product: Partial<Product>): ApiResponse<boolean> {
    const errors: string[] = [];

    if (!product.name?.trim()) errors.push('Name is required');
    if (!product.sku) errors.push('SKU is required');
    if (!product.category) errors.push('Category is required');

    if (product.price === undefined || product.price === null) {
      errors.push('Price is required');
    } else if (product.price < 0) {
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
      return { success: false, error: errors.join(', ') };
    }

    return { success: true, data: true };
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
