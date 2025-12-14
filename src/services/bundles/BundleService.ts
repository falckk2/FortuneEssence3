import { injectable, inject } from 'tsyringe';
import type {
  IBundleService,
  IBundleRepository,
  IProductRepository,
  IInventoryService
} from '@/interfaces';
import type {
  BundleConfiguration,
  ApiResponse,
  Product
} from '@/types';
import { BundleValidationResult } from '@/types/bundles';
import { TOKENS } from '@/config/di-container';

@injectable()
export class BundleService implements IBundleService {
  constructor(
    @inject(TOKENS.IBundleRepository) private readonly bundleRepository: IBundleRepository,
    @inject(TOKENS.IProductRepository) private readonly productRepository: IProductRepository,
    @inject(TOKENS.IInventoryService) private readonly inventoryService: IInventoryService
  ) {}

  async getBundleConfiguration(bundleProductId: string): Promise<ApiResponse<BundleConfiguration>> {
    return this.bundleRepository.findByProductId(bundleProductId);
  }

  async getAllBundleConfigurations(): Promise<ApiResponse<BundleConfiguration[]>> {
    return this.bundleRepository.findAll();
  }

  async getEligibleProducts(bundleProductId: string): Promise<ApiResponse<Product[]>> {
    try {
      // Get bundle configuration
      const configResult = await this.getBundleConfiguration(bundleProductId);
      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: 'Bundle configuration not found',
        };
      }

      const config = configResult.data;

      // Get all products in allowed category that are in stock
      const productsResult = await this.productRepository.findAll({
        category: config.allowedCategory,
        inStock: true,
      });

      if (!productsResult.success) {
        return {
          success: false,
          error: productsResult.error,
        };
      }

      // Filter to only active products with stock > 0
      const eligibleProducts = (productsResult.data || []).filter(
        p => p.isActive && p.stock > 0
      );

      return {
        success: true,
        data: eligibleProducts,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get eligible products: ${error}`,
      };
    }
  }

  async validateBundleSelection(
    bundleProductId: string,
    selectedProductIds: string[],
    quantities: { [productId: string]: number } = {}
  ): Promise<ApiResponse<BundleValidationResult>> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Get bundle configuration
      const configResult = await this.getBundleConfiguration(bundleProductId);
      if (!configResult.success || !configResult.data) {
        errors.push('Invalid bundle configuration');
        return {
          success: true,
          data: { isValid: false, errors, warnings },
        };
      }

      const config = configResult.data;

      // Check correct quantity
      if (selectedProductIds.length !== config.requiredQuantity) {
        errors.push(
          `Bundle requires exactly ${config.requiredQuantity} products, but ${selectedProductIds.length} were selected`
        );
      }

      // Note: Duplicates are allowed - customers can select the same product multiple times
      // This enables quantity bundles (e.g., 3x Lavender Oil)

      // Validate each selected product
      for (const productId of selectedProductIds) {
        const productResult = await this.productRepository.findById(productId);

        if (!productResult.success || !productResult.data) {
          errors.push(`Product ${productId} not found`);
          continue;
        }

        const product = productResult.data;

        // Check category
        if (product.category !== config.allowedCategory) {
          errors.push(
            `Product "${product.name}" is not eligible for this bundle (wrong category)`
          );
        }

        // Check if active
        if (!product.isActive) {
          errors.push(`Product "${product.name}" is no longer available`);
        }

        // Check stock
        const requestedQty = quantities[productId] || 1;
        if (product.stock < requestedQty) {
          errors.push(
            `Product "${product.name}" has insufficient stock (${product.stock} available, ${requestedQty} requested)`
          );
        } else if (product.stock <= 5 && product.stock >= requestedQty) {
          warnings.push(`Product "${product.name}" is low in stock (only ${product.stock} left)`);
        }
      }

      return {
        success: true,
        data: {
          isValid: errors.length === 0,
          errors,
          warnings,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to validate bundle selection: ${error}`,
      };
    }
  }

  async calculateBundlePrice(
    bundleProductId: string,
    selectedProductIds: string[]
  ): Promise<ApiResponse<{ bundlePrice: number; individualTotal: number; savings: number }>> {
    try {
      // Get bundle product
      const bundleResult = await this.productRepository.findById(bundleProductId);
      if (!bundleResult.success || !bundleResult.data) {
        return {
          success: false,
          error: 'Bundle product not found',
        };
      }

      const bundlePrice = bundleResult.data.price;

      // Calculate individual total
      let individualTotal = 0;
      for (const productId of selectedProductIds) {
        const productResult = await this.productRepository.findById(productId);
        if (productResult.success && productResult.data) {
          individualTotal += productResult.data.price;
        }
      }

      const savings = individualTotal - bundlePrice;

      return {
        success: true,
        data: {
          bundlePrice,
          individualTotal,
          savings,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to calculate bundle price: ${error}`,
      };
    }
  }
}
