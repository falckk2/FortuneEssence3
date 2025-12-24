'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '@/stores/cartStore';
import { Product, BundleSelection } from '@/types';
import { PriceCalculator } from '@/utils/helpers';
import Image from 'next/image';
import Link from 'next/link';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: 'sv' | 'en';
}

interface CartItemWithProduct {
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
  bundleSelection?: BundleSelection;
  selectedProducts?: Product[];
}

export const CartSidebar = ({ isOpen, onClose, locale = 'sv' }: CartSidebarProps) => {
  const { items, total, isLoading, updateQuantity, removeItem, clearCart, getItemCount } = useCartStore();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Fetch product details for cart items
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (items.length === 0) {
        setCartItems([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const itemsWithProducts: CartItemWithProduct[] = [];

        for (const item of items) {
          try {
            const response = await fetch(`/api/products/${item.productId}?locale=${locale}`);

            // Check if response is OK before parsing JSON
            if (!response.ok) {
              console.warn(`Product ${item.productId} not found (${response.status})`);
              itemsWithProducts.push({ ...item });
              continue;
            }

            const result = await response.json();

            const cartItem: CartItemWithProduct = {
              ...item,
              product: result.success ? result.data : undefined,
            };

            // If this is a bundle with selected products, fetch those products too
            if (item.bundleSelection && item.bundleSelection.selectedProductIds) {
              const selectedProducts: Product[] = [];

              for (const selectedProductId of item.bundleSelection.selectedProductIds) {
                try {
                  const prodResponse = await fetch(`/api/products/${selectedProductId}?locale=${locale}`);

                  if (!prodResponse.ok) {
                    console.warn(`Selected product ${selectedProductId} not found (${prodResponse.status})`);
                    continue;
                  }

                  const prodResult = await prodResponse.json();

                  if (prodResult.success) {
                    selectedProducts.push(prodResult.data);
                  }
                } catch (err) {
                  console.error(`Error fetching selected product ${selectedProductId}:`, err);
                }
              }

              cartItem.selectedProducts = selectedProducts;
            }

            itemsWithProducts.push(cartItem);
          } catch (err) {
            console.error(`Error fetching product ${item.productId}:`, err);
            itemsWithProducts.push({ ...item });
          }
        }

        setCartItems(itemsWithProducts);
      } catch (error) {
        console.error('Failed to fetch product details:', error);
        setCartItems(items.map(item => ({ ...item })));
      } finally {
        setLoadingProducts(false);
      }
    };

    if (isOpen) {
      fetchProductDetails();
    }
  }, [items, isOpen, locale]);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    await updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId: string) => {
    await removeItem(productId);
  };

  const handleClearCart = async () => {
    if (window.confirm(locale === 'sv' ? 'Är du säker på att du vill tömma varukorgen?' : 'Are you sure you want to clear the cart?')) {
      await clearCart();
    }
  };

  const getProductImage = (product?: Product) => {
    if (!product || !product.images || product.images.length === 0) {
      return '/images/placeholder-product.jpg';
    }
    return product.images[0];
  };

  const getProductName = (product?: Product) => {
    if (!product) return 'Unknown Product';
    return locale === 'sv' ? product.translations.sv.name : product.translations.en.name;
  };

  const subtotal = PriceCalculator.formatPrice(total, locale);
  const estimatedTax = PriceCalculator.formatPrice(PriceCalculator.calculateVAT(total), locale);
  const totalWithTax = PriceCalculator.formatPrice(PriceCalculator.calculatePriceWithVAT(total), locale);
  const itemCount = getItemCount();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          {locale === 'sv' ? 'Varukorg' : 'Shopping Cart'}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flow-root">
                          {loadingProducts ? (
                            <div className="space-y-4">
                              {[...Array(items.length)].map((_, i) => (
                                <div key={i} className="animate-pulse flex space-x-4">
                                  <div className="rounded bg-gray-300 h-20 w-20"></div>
                                  <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : cartItems.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                                </svg>
                              </div>
                              <h3 className="text-sm font-medium text-gray-900 mb-2">
                                {locale === 'sv' ? 'Din varukorg är tom' : 'Your cart is empty'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {locale === 'sv' ? 'Lägg till produkter för att fortsätta' : 'Add products to continue'}
                              </p>
                            </div>
                          ) : (
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {cartItems.map((item) => (
                                <li key={item.productId} className="flex py-6">
                                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <Image
                                      src={getProductImage(item.product)}
                                      alt={getProductName(item.product)}
                                      width={80}
                                      height={80}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                          <Link
                                            href={`/products/${item.productId}`}
                                            onClick={onClose}
                                            className="hover:text-purple-600"
                                          >
                                            {getProductName(item.product)}
                                          </Link>
                                        </h3>
                                        <p className="ml-4">
                                          {PriceCalculator.formatPrice(item.price * item.quantity, locale)}
                                        </p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">
                                        {PriceCalculator.formatPrice(item.price, locale)} {locale === 'sv' ? 'st' : 'each'}
                                      </p>

                                      {/* Bundle Contents */}
                                      {item.bundleSelection && item.selectedProducts && item.selectedProducts.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                          <p className="text-xs font-medium text-sage-700 uppercase tracking-wide">
                                            {locale === 'sv' ? 'Innehåller:' : 'Contains:'}
                                          </p>
                                          <ul className="space-y-1">
                                            {item.selectedProducts.map((selectedProduct, idx) => (
                                              <li key={`${item.productId}-${selectedProduct.id}-${idx}`} className="flex items-center text-xs text-gray-600">
                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sage-500 mr-2"></span>
                                                {locale === 'sv' ? selectedProduct.translations.sv.name : selectedProduct.translations.en.name}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                          disabled={isLoading || item.quantity <= 1}
                                          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <MinusIcon className="h-4 w-4" />
                                        </button>
                                        <span className="font-medium">{item.quantity}</span>
                                        <button
                                          onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                          disabled={isLoading}
                                          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <PlusIcon className="h-4 w-4" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.productId)}
                                        disabled={isLoading}
                                        className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                      >
                                        <TrashIcon className="h-4 w-4 mr-1" />
                                        {locale === 'sv' ? 'Ta bort' : 'Remove'}
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    {cartItems.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="space-y-4">
                          {/* Clear Cart Button */}
                          <button
                            onClick={handleClearCart}
                            disabled={isLoading}
                            className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {locale === 'sv' ? 'Töm varukorg' : 'Clear cart'}
                          </button>

                          {/* Subtotal */}
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <p>{locale === 'sv' ? 'Subtotal' : 'Subtotal'}</p>
                            <p>{subtotal}</p>
                          </div>

                          {/* Tax */}
                          <div className="flex justify-between text-sm text-gray-600">
                            <p>{locale === 'sv' ? 'Moms (25%)' : 'VAT (25%)'}</p>
                            <p>{estimatedTax}</p>
                          </div>

                          {/* Total */}
                          <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-4">
                            <p>{locale === 'sv' ? 'Totalt' : 'Total'}</p>
                            <p>{totalWithTax}</p>
                          </div>

                          <p className="text-sm text-gray-500">
                            {locale === 'sv' 
                              ? 'Frakt och leverans beräknas vid kassan.'
                              : 'Shipping and delivery calculated at checkout.'
                            }
                          </p>

                          <div className="mt-6">
                            <Link
                              href="/checkout"
                              onClick={onClose}
                              className="flex w-full items-center justify-center rounded-md border border-transparent bg-purple-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {locale === 'sv' ? 'Gå till kassan' : 'Checkout'}
                            </Link>
                          </div>

                          <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                            <p>
                              {locale === 'sv' ? 'eller ' : 'or '}
                              <button
                                type="button"
                                className="font-medium text-purple-600 hover:text-purple-500"
                                onClick={onClose}
                              >
                                {locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
                                <span aria-hidden="true"> &rarr;</span>
                              </button>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};