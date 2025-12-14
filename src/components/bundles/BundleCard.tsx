'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { BundleImage } from './BundleImage';

interface BundleCardProps {
  product: Product;
  requiredQuantity: number;
  discountPercentage: number;
  locale?: 'sv' | 'en';
}

export function BundleCard({
  product,
  requiredQuantity,
  discountPercentage,
  locale = 'sv',
}: BundleCardProps) {
  const regularPrice = 89 * requiredQuantity;
  const savings = regularPrice - product.price;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-xl border-2 border-sage-200 hover:border-sage-400 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Badge */}
      <div className="relative">
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-sage-600 to-forest-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
          {locale === 'sv' ? 'SPARA' : 'SAVE'} {savings} kr
        </div>

        {/* Image - Layered Lavender bottles */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-sage-50 to-forest-50 flex items-center justify-center p-8">
          <div className="group-hover:scale-105 transition-transform duration-300">
            <BundleImage quantity={requiredQuantity} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title */}
        <h3 className="text-xl font-serif font-bold text-forest-800 mb-2 group-hover:text-sage-700 transition-colors">
          {locale === 'sv' ? product.nameSv : product.nameEn}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {locale === 'sv' ? product.descriptionSv : product.descriptionEn}
        </p>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-forest-900">
            {product.price} kr
          </span>
          <span className="text-lg text-gray-500 line-through">
            {regularPrice} kr
          </span>
        </div>

        {/* Discount Badge */}
        <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-800 px-3 py-1 rounded-full text-sm font-semibold mb-4">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          {discountPercentage.toFixed(0)}%{' '}
          {locale === 'sv' ? 'rabatt' : 'off'}
        </div>

        {/* Features */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-sage-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>
              {requiredQuantity}x {locale === 'sv' ? 'Lavendel Eterisk Olja' : 'Lavender Essential Oil'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-sage-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>
              {locale === 'sv'
                ? '10ml vardera, premium kvalitet'
                : '10ml each, premium quality'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg
              className="w-5 h-5 text-sage-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>
              {locale === 'sv'
                ? 'Spara mer ju fler du köper'
                : 'Save more when you buy more'}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <span className="text-sm font-medium text-sage-700">
            {locale === 'sv' ? 'Bygg din egen' : 'Build your own'}
          </span>
          <svg
            className="w-5 h-5 text-sage-600 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
