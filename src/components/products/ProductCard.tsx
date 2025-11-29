'use client';

import { Product } from '@/types';
import { PriceCalculator } from '@/utils/helpers';
import { getProductBenefits } from '@/utils/productBenefits';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  locale?: 'sv' | 'en';
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
  isInWishlist?: boolean;
  className?: string;
}

export const ProductCard = ({ 
  product, 
  locale = 'sv', 
  onAddToCart, 
  onToggleWishlist,
  isInWishlist = false,
  className = '' 
}: ProductCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const localizedName = product.translations[locale].name;
  const localizedDescription = product.translations[locale].description;
  const formattedPrice = PriceCalculator.formatPrice(product.price, locale);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = async () => {
    if (isOutOfStock || !onAddToCart) return;
    
    setIsLoading(true);
    try {
      await onAddToCart(product.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWishlist = () => {
    if (onToggleWishlist) {
      onToggleWishlist(product.id);
    }
  };

  const getProductImage = () => {
    if (imageError || !product.images || product.images.length === 0) {
      return '/images/placeholder-product.jpg';
    }
    return product.images[0];
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'essential-oils': 'bg-sage-100 text-sage-700 border-sage-200',
      'carrier-oils': 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
      'diffusers': 'bg-cream-300 text-forest-700 border-cream-400',
      'accessories': 'bg-forest-100 text-forest-700 border-forest-200',
      'gift-sets': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[category] || 'bg-cream-200 text-forest-700 border-cream-300';
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: { sv: string; en: string } } = {
      'essential-oils': { sv: 'Eteriska oljor', en: 'Essential Oils' },
      'carrier-oils': { sv: 'Bäraroljor', en: 'Carrier Oils' },
      'diffusers': { sv: 'Diffusers', en: 'Diffusers' },
      'accessories': { sv: 'Tillbehör', en: 'Accessories' },
      'gift-sets': { sv: 'Presentset', en: 'Gift Sets' },
    };
    return names[category]?.[locale] || category;
  };

  const productBenefits = getProductBenefits(product.name, product.category);

  return (
    <div className={`bg-white rounded-3xl shadow-soft hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1 transform ${className}`}>
      <div className="relative">
        <Link href={`/products/${product.id}`}>
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-cream-100">
            <Image
              src={getProductImage()}
              alt={localizedName}
              width={300}
              height={300}
              className="h-64 w-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
              onError={() => setImageError(true)}
              priority={false}
            />
          </div>
        </Link>

        {/* Benefit Badges - Top Priority */}
        {productBenefits.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
            {productBenefits.map((benefit) => (
              <span
                key={benefit.key}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border ${benefit.color} shadow-sm`}
              >
                <span>{benefit.icon}</span>
                <span>{benefit.label[locale]}</span>
              </span>
            ))}
          </div>
        )}

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/95 backdrop-blur-sm shadow-soft hover:bg-white hover:scale-110 transition-all z-10"
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isInWishlist ? (
              <HeartSolidIcon className="h-5 w-5 text-rose-500" />
            ) : (
              <HeartIcon className="h-5 w-5 text-forest-400 hover:text-rose-500 transition-colors" />
            )}
          </button>
        )}

        {/* Stock Status */}
        {isOutOfStock && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 backdrop-blur-sm">
              {locale === 'sv' ? 'Slut i lager' : 'Out of stock'}
            </span>
          </div>
        )}

        {isLowStock && !isOutOfStock && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-terracotta-100 text-terracotta-800 border border-terracotta-200 backdrop-blur-sm">
              {locale === 'sv' ? `Bara ${product.stock} kvar!` : `Only ${product.stock} left!`}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Category Badge - Small and understated */}
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(product.category)}`}>
            {getCategoryName(product.category)}
          </span>
        </div>

        <div className="mb-3">
          <Link href={`/products/${product.id}`}>
            <h3 className="text-xl font-serif font-semibold text-forest-800 group-hover:text-sage-700 transition-colors line-clamp-2 leading-snug">
              {localizedName}
            </h3>
          </Link>
        </div>

        <p className="text-sm text-forest-600 line-clamp-2 mb-4 leading-relaxed">
          {localizedDescription}
        </p>

        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-forest-800">
              {formattedPrice}
            </span>
            <span className="text-xs text-forest-500">
              {locale === 'sv' ? 'Inkl. moms' : 'Incl. VAT'}
            </span>
          </div>
        </div>

        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isLoading}
            className={`w-full flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-medium transition-all shadow-soft ${
              isOutOfStock
                ? 'bg-cream-200 text-forest-400 cursor-not-allowed'
                : 'bg-sage-600 text-white hover:bg-sage-700 hover:shadow-lg hover:-translate-y-0.5 transform active:translate-y-0'
            } ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              !isOutOfStock && <ShoppingCartIcon className="h-5 w-5 mr-2" />
            )}
            {isOutOfStock
              ? (locale === 'sv' ? 'Slutsåld' : 'Sold Out')
              : (locale === 'sv' ? 'Lägg i varukorg' : 'Add to Cart')
            }
          </button>
        )}
      </div>
    </div>
  );
};