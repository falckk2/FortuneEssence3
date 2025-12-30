'use client';

import { Product } from '@/types';
import { ProductCard } from './ProductCard';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, setAuthenticated, refreshWishlist } = useWishlistStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sync authentication state with wishlist store
  useEffect(() => {
    const isAuth = !!session?.user;
    setAuthenticated(isAuth);

    // Load wishlist when user logs in
    if (isAuth) {
      refreshWishlist();
    }
  }, [session, setAuthenticated, refreshWishlist]);

  const handleAddToCart = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      await addItem({
        productId: product.id,
        quantity: 1,
        price: product.price,
      });

      const productName = product.translations[locale].name;
      toast.success(
        locale === 'sv'
          ? `${productName} tillagd i varukorgen!`
          : `${productName} added to cart!`,
        {
          duration: 3000,
          icon: '🛒',
        }
      );
    } catch (error) {
      console.error('Failed to add to cart:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        locale === 'sv'
          ? `Kunde inte lägga till i varukorgen: ${errorMessage}`
          : `Failed to add to cart: ${errorMessage}`,
        {
          duration: 5000,
        }
      );
    }
  };

  const handleToggleWishlist = async (productId: string) => {
    // Check if user is authenticated
    if (!session?.user) {
      toast.error(
        locale === 'sv'
          ? 'Du måste vara inloggad för att använda önskelistan'
          : 'You must be logged in to use the wishlist',
        {
          duration: 3000,
        }
      );
      router.push('/auth/signin');
      return;
    }

    const isInWishlist = wishlistItems.some(item => item.productId === productId);

    try {
      if (isInWishlist) {
        await removeFromWishlist(productId);
        toast.success(
          locale === 'sv'
            ? 'Borttagen från önskelistan'
            : 'Removed from wishlist',
          {
            duration: 2000,
            icon: '💔',
          }
        );
      } else {
        await addToWishlist(productId);
        const product = products.find(p => p.id === productId);
        const productName = product?.translations[locale].name || '';
        toast.success(
          locale === 'sv'
            ? `${productName} tillagd i önskelistan!`
            : `${productName} added to wishlist!`,
          {
            duration: 2000,
            icon: '❤️',
          }
        );
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        locale === 'sv'
          ? `Kunde inte uppdatera önskelistan: ${errorMessage}`
          : `Failed to update wishlist: ${errorMessage}`,
        {
          duration: 5000,
        }
      );
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