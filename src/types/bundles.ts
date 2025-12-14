import { Product, BundleConfiguration } from './index';

export interface BundleProduct extends Product {
  bundleConfig?: BundleConfiguration;
}

export interface BundleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BundleSelectionState {
  bundleProductId: string;
  requiredQuantity: number;
  selectedProducts: Product[];
  availableProducts: Product[];
  totalPrice: number;
  savings: number;
}

export interface BundleAddToCartData {
  bundleProductId: string;
  selectedProductIds: string[];
  quantity: number;
}
