'use client';

import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useState, useEffect } from 'react';

interface ProductGridProps {
  products: Product[];
  locale?: 'sv' | 'en';
  className?: string;
  showAddToCart?: boolean;
  showWishlist?: boolean;
  emptyMessage?: string;
}

export const ProductGrid = ({ 
  products, 
  locale = 'sv', 
  className = '',
  showAddToCart = true,
  showWishlist = true,
  emptyMessage
}: ProductGridProps) => {
  const [isClient, setIsClient] = useState(false);
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    await addItem({
      productId: product.id,
      quantity: 1,
      price: product.price,
    });
  };

  const handleToggleWishlist = (productId: string) => {
    const isInWishlist = wishlistItems.some(item => item.productId === productId);
    
    if (isInWishlist) {
      removeFromWishlist(productId);
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        addToWishlist({
          productId: product.id,
          addedAt: new Date(),
        });
      }
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyMessage || (locale === 'sv' ? 'Inga produkter hittades' : 'No products found')}
        </h3>
        <p className="text-gray-500">
          {locale === 'sv' 
            ? 'Försök att ändra dina filterinställningar eller sök efter något annat.' 
            : 'Try changing your filter settings or search for something else.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          onAddToCart={showAddToCart ? handleAddToCart : undefined}
          onToggleWishlist={showWishlist ? handleToggleWishlist : undefined}
          isInWishlist={isClient ? wishlistItems.some(item => item.productId === product.id) : false}
        />
      ))}
    </div>
  );
};