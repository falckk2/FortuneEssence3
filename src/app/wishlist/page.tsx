'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { ProductCard } from '@/components/products/ProductCard';
import {
  HeartIcon,
  ShoppingBagIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = 'sv'; // Would come from context in real app
  const { data: session, status } = useSession();
  const router = useRouter();

  const { items: wishlistItems, removeItem, setAuthenticated, refreshWishlist } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      toast.error(
        locale === 'sv'
          ? 'Du måste vara inloggad för att se din önskelista'
          : 'You must be logged in to view your wishlist'
      );
      router.push('/auth/signin');
    }
  }, [session, status, router, locale]);

  // Sync authentication state and load wishlist
  useEffect(() => {
    const isAuth = !!session?.user;
    setAuthenticated(isAuth);

    if (isAuth) {
      refreshWishlist();
    }
  }, [session, setAuthenticated, refreshWishlist]);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistItems.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch all products and filter by wishlist IDs
        const response = await fetch('/api/products?locale=' + locale);
        const data = await response.json();

        if (data.success) {
          const wishlistProductIds = wishlistItems.map(item => item.productId);
          const wishlistProducts = data.data.filter((product: Product) =>
            wishlistProductIds.includes(product.id)
          );
          setProducts(wishlistProducts);
        }
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error);
        toast.error(locale === 'sv' ? 'Kunde inte ladda önskelistan' : 'Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistItems, locale]);

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeItem(productId);
      toast.success(locale === 'sv' ? 'Borttagen från önskelista' : 'Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error(locale === 'sv' ? 'Kunde inte ta bort från önskelista' : 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      if (product.stock === 0) {
        toast.error(locale === 'sv' ? 'Produkten är slutsåld' : 'Product is out of stock');
        return;
      }

      await addToCart({
        productId,
        quantity: 1,
        price: product.price
      });
      toast.success(locale === 'sv' ? 'Tillagd i varukorgen' : 'Added to cart');
    } catch (error) {
      toast.error(locale === 'sv' ? 'Kunde inte lägga till i varukorgen' : 'Failed to add to cart');
    }
  };

  const handleAddAllToCart = async () => {
    const inStockProducts = products.filter(p => p.stock > 0);

    if (inStockProducts.length === 0) {
      toast.error(locale === 'sv' ? 'Inga produkter i lager' : 'No products in stock');
      return;
    }

    try {
      for (const product of inStockProducts) {
        await addToCart({
          productId: product.id,
          quantity: 1,
          price: product.price
        });
      }
      toast.success(
        locale === 'sv'
          ? `${inStockProducts.length} produkter tillagda i varukorgen`
          : `${inStockProducts.length} products added to cart`
      );
    } catch (error) {
      toast.error(locale === 'sv' ? 'Kunde inte lägga till alla produkter' : 'Failed to add all products');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-800 mb-2">
                {locale === 'sv' ? 'Min önskelista' : 'My Wishlist'}
              </h1>
              <p className="text-forest-600">
                {products.length === 0
                  ? (locale === 'sv' ? 'Din önskelista är tom' : 'Your wishlist is empty')
                  : (locale === 'sv'
                    ? `${products.length} ${products.length === 1 ? 'produkt' : 'produkter'} i din önskelista`
                    : `${products.length} ${products.length === 1 ? 'item' : 'items'} in your wishlist`)
                }
              </p>
            </div>

            {products.length > 0 && (
              <button
                onClick={handleAddAllToCart}
                className="hidden md:flex items-center gap-2 px-6 py-3.5 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
              >
                <ShoppingBagIcon className="h-5 w-5" />
                {locale === 'sv' ? 'Lägg alla i varukorgen' : 'Add All to Cart'}
              </button>
            )}
          </div>

          {/* Mobile Add All Button */}
          {products.length > 0 && (
            <button
              onClick={handleAddAllToCart}
              className="md:hidden w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              {locale === 'sv' ? 'Lägg alla i varukorgen' : 'Add All to Cart'}
            </button>
          )}
        </div>

        {/* Empty State */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-soft p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-cream-200 flex items-center justify-center">
                <HeartIcon className="h-12 w-12 text-forest-400" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-forest-800 mb-3">
                {locale === 'sv' ? 'Din önskelista är tom' : 'Your wishlist is empty'}
              </h2>
              <p className="text-forest-600 mb-8">
                {locale === 'sv'
                  ? 'Utforska våra produkter och lägg till dina favoriter här'
                  : 'Explore our products and add your favorites here'
                }
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
              >
                {locale === 'sv' ? 'Utforska produkter' : 'Explore Products'}
                <ArrowRightIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                locale={locale}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleRemoveFromWishlist}
                isInWishlist={true}
              />
            ))}
          </div>
        )}

        {/* Continue Shopping Link */}
        {products.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-800 font-medium transition-colors"
            >
              {locale === 'sv' ? 'Fortsätt handla' : 'Continue Shopping'}
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
