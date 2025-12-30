'use client';

import { ShippingRate } from '@/types';
import Image from 'next/image';
import { CheckCircle2, Circle } from 'lucide-react';

interface CarrierOptionProps {
  rate: ShippingRate;
  selected: boolean;
  onClick: () => void;
  locale?: 'sv' | 'en';
}

export default function CarrierOption({ rate, selected, onClick, locale = 'sv' }: CarrierOptionProps) {
  const isFree = rate.price === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg border-2 transition-all text-left
        ${selected
          ? 'border-sage-600 bg-sage-50 shadow-md'
          : 'border-gray-200 hover:border-sage-300 bg-white hover:bg-sage-50/30'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Selection indicator */}
        <div className="flex-shrink-0 mt-1">
          {selected ? (
            <CheckCircle2 className="w-6 h-6 text-sage-600" />
          ) : (
            <Circle className="w-6 h-6 text-gray-300" />
          )}
        </div>

        {/* Carrier logo */}
        {rate.logoUrl && (
          <div className="flex-shrink-0 w-16 h-16 relative">
            <Image
              src={rate.logoUrl}
              alt={rate.name}
              fill
              className="object-contain"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Carrier details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-forest-800 text-base">
              {rate.name}
            </h3>
            <div className="flex-shrink-0">
              {isFree ? (
                <span className="text-lg font-bold text-green-600">
                  {locale === 'sv' ? 'Gratis' : 'Free'}
                </span>
              ) : (
                <span className="text-lg font-bold text-forest-800">
                  {rate.price.toFixed(0)} kr
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {rate.description}
          </p>

          {/* Delivery estimate */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {rate.estimatedDays === 0
                ? (locale === 'sv' ? 'Samma dag' : 'Same day')
                : rate.estimatedDays === 1
                ? (locale === 'sv' ? 'Nästa arbetsdag' : 'Next business day')
                : `${rate.estimatedDays} ${locale === 'sv' ? 'dagar' : 'days'}`
              }
            </span>
          </div>

          {/* Features as badges */}
          {rate.features && rate.features.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {rate.features.slice(0, 4).map((feature, idx) => (
                <span
                  key={idx}
                  className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${rate.isEcoFriendly && feature.toLowerCase().includes('miljö')
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  {feature}
                </span>
              ))}
            </div>
          )}

          {/* Eco-friendly badge */}
          {rate.isEcoFriendly && (
            <div className="mt-2 flex items-center gap-1 text-green-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-medium">
                {locale === 'sv' ? 'Miljövänligt alternativ' : 'Eco-friendly option'}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
