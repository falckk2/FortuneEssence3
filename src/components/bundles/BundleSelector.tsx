'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product, BundleConfiguration } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import toast from 'react-hot-toast';

interface BundleSelectorProps {
  bundleProduct: Product;
  bundleConfig: BundleConfiguration;
  locale?: 'sv' | 'en';
  onAddToCart?: (selectedProductIds: string[]) => void;
}

export function BundleSelector({
  bundleProduct,
  bundleConfig,
  locale = 'sv',
  onAddToCart,
}: BundleSelectorProps) {
  const { addBundle } = useCartStore();
  const [eligibleProducts, setEligibleProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch eligible products
  useEffect(() => {
    async function fetchEligibleProducts() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/bundles/${bundleProduct.id}/eligible-products`
        );
        const data = await response.json();

        if (data.success) {
          setEligibleProducts(data.data);
        } else {
          setError(data.error || 'Failed to load products');
        }
      } catch (err) {
        setError('Failed to load products');
        console.error('Error fetching eligible products:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEligibleProducts();
  }, [bundleProduct.id]);

  // Validate selection whenever it changes
  useEffect(() => {
    async function validateSelection() {
      if (selectedProducts.length === 0) {
        setValidationErrors([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/bundles/${bundleProduct.id}/validate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              selectedProductIds: selectedProducts,
            }),
          }
        );

        const data = await response.json();
        if (data.success && data.data) {
          setValidationErrors(data.data.errors || []);
        }
      } catch (err) {
        console.error('Validation error:', err);
      }
    }

    validateSelection();
  }, [selectedProducts, bundleProduct.id]);

  const handleProductClick = (productId: string) => {
    setSelectedProducts((prev) => {
      const currentCount = productCounts[productId] || 0;
      const totalSelected = prev.length;

      // Can't exceed required quantity
      if (totalSelected >= bundleConfig.requiredQuantity) {
        return prev;
      }

      // Add this product one more time
      setProductCounts((counts) => ({
        ...counts,
        [productId]: currentCount + 1,
      }));

      return [...prev, productId];
    });
  };

  const handleProductRemove = (productId: string) => {
    setSelectedProducts((prev) => {
      const currentCount = productCounts[productId] || 0;

      if (currentCount === 0) return prev;

      // Remove one instance of this product
      setProductCounts((counts) => ({
        ...counts,
        [productId]: currentCount - 1,
      }));

      // Remove the first occurrence of this productId
      const index = prev.indexOf(productId);
      if (index > -1) {
        const newSelection = [...prev];
        newSelection.splice(index, 1);
        return newSelection;
      }

      return prev;
    });
  };

  const handleAddToCart = async () => {
    if (validationErrors.length > 0) return;

    setIsAddingToCart(true);
    try {
      await addBundle(bundleProduct.id, selectedProducts, 1);

      // Success! Show toast notification
      const bundleName = bundleProduct.translations[locale].name;
      toast.success(
        locale === 'sv'
          ? `${bundleName} tillagt i varukorgen!`
          : `${bundleName} added to cart!`,
        {
          duration: 3000,
          icon: '🛒',
        }
      );

      // Reset selection and call callback
      setSelectedProducts([]);
      setProductCounts({});
      onAddToCart?.(selectedProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(errorMessage);
      toast.error(
        locale === 'sv'
          ? 'Kunde inte lägga till paketet i varukorgen'
          : 'Failed to add bundle to cart'
      );
      console.error('Error adding bundle to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const isSelectionComplete =
    selectedProducts.length === bundleConfig.requiredQuantity &&
    validationErrors.length === 0;

  const regularPrice = 89 * bundleConfig.requiredQuantity;
  const savings = regularPrice - bundleProduct.price;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sage-50 to-forest-50 rounded-lg p-6">
        <h3 className="text-2xl font-serif font-bold text-forest-800 mb-2">
          {locale === 'sv'
            ? `Välj ${bundleConfig.requiredQuantity} oljor`
            : `Choose ${bundleConfig.requiredQuantity} oils`}
        </h3>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-3xl font-bold text-forest-900">
            {bundleProduct.price} kr
          </span>
          <span className="text-lg text-gray-500 line-through">
            {regularPrice} kr
          </span>
          <span className="bg-sage-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {locale === 'sv' ? 'Spara' : 'Save'} {savings} kr
          </span>
        </div>
        <p className="text-gray-600">
          {locale === 'sv'
            ? `${bundleConfig.discountPercentage.toFixed(0)}% rabatt mot ordinarie pris`
            : `${bundleConfig.discountPercentage.toFixed(0)}% discount from regular price`}
        </p>
      </div>

      {/* Selection Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {locale === 'sv' ? 'Valda oljor' : 'Selected oils'}
          </span>
          <span
            className={`text-sm font-bold ${
              isSelectionComplete ? 'text-sage-600' : 'text-gray-500'
            }`}
          >
            {selectedProducts.length} / {bundleConfig.requiredQuantity}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isSelectionComplete ? 'bg-sage-600' : 'bg-forest-400'
            }`}
            style={{
              width: `${(selectedProducts.length / bundleConfig.requiredQuantity) * 100}%`,
            }}
          ></div>
        </div>
        {validationErrors.length > 0 && (
          <div className="mt-2 text-sm text-red-600">
            {validationErrors.join(', ')}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {eligibleProducts.map((product) => {
          const count = productCounts[product.id] || 0;
          const isSelected = count > 0;
          const canSelect = selectedProducts.length < bundleConfig.requiredQuantity;

          return (
            <div
              key={product.id}
              className={`
                relative rounded-lg border-2 p-4 transition-all duration-200
                ${
                  isSelected
                    ? 'border-sage-600 bg-sage-50 shadow-md'
                    : canSelect
                      ? 'border-gray-200 hover:border-sage-300 hover:shadow-sm'
                      : 'border-gray-200 opacity-50'
                }
              `}
            >
              {/* Count Badge */}
              {count > 0 && (
                <div className="absolute top-2 right-2 bg-sage-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md z-10">
                  {count}x
                </div>
              )}

              {/* Product Image */}
              <div className="relative w-full aspect-square mb-3 rounded-md overflow-hidden bg-gray-100">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-12 h-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <h4 className="text-sm font-medium text-gray-900 mb-1 text-center line-clamp-2">
                {locale === 'sv' ? product.translations.sv.name : product.translations.en.name}
              </h4>

              {/* Product Price */}
              <p className="text-xs text-gray-500 text-center mb-3">
                {product.price} kr
              </p>

              {/* Add/Remove Controls */}
              <div className="flex items-center justify-center gap-2">
                {count > 0 && (
                  <button
                    onClick={() => handleProductRemove(product.id)}
                    className="w-8 h-8 rounded-full bg-white border-2 border-sage-300 text-sage-700 font-bold hover:bg-sage-100 hover:border-sage-600 transition-all"
                  >
                    −
                  </button>
                )}
                <button
                  onClick={() => handleProductClick(product.id)}
                  disabled={!canSelect}
                  className={`
                    w-8 h-8 rounded-full font-bold transition-all
                    ${
                      canSelect
                        ? 'bg-sage-600 text-white hover:bg-sage-700 shadow-sm hover:shadow-md'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isSelectionComplete || isAddingToCart}
        className={`
          w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200
          ${
            isSelectionComplete && !isAddingToCart
              ? 'bg-sage-600 hover:bg-sage-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isAddingToCart
          ? locale === 'sv'
            ? 'Lägger till...'
            : 'Adding...'
          : locale === 'sv'
            ? 'Lägg till i varukorgen'
            : 'Add to Cart'}
      </button>

      {/* Helper Text */}
      {!isSelectionComplete && selectedProducts.length > 0 && (
        <p className="text-center text-sm text-gray-600">
          {locale === 'sv'
            ? `Välj ${bundleConfig.requiredQuantity - selectedProducts.length} till ${bundleConfig.requiredQuantity - selectedProducts.length === 1 ? 'olja' : 'oljor'}`
            : `Choose ${bundleConfig.requiredQuantity - selectedProducts.length} more ${bundleConfig.requiredQuantity - selectedProducts.length === 1 ? 'oil' : 'oils'}`}
        </p>
      )}
    </div>
  );
}
