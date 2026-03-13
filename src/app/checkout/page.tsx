'use client';

import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';

export default function CheckoutPage() {
  const { locale } = useLocale();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/products"
            className="inline-flex items-center text-sage-600 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-300 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
          </Link>
          
          <h1 className="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8]">
            {locale === 'sv' ? 'Kassa' : 'Checkout'}
          </h1>
          <p className="text-forest-600 dark:text-[#B8C5B8] mt-2">
            {locale === 'sv' 
              ? 'Slutför din beställning säkert och enkelt'
              : 'Complete your order securely and easily'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-sage-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                1
              </div>
              <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-forest-900 dark:text-[#E8EDE8]">
                {locale === 'sv' ? 'Information' : 'Information'}
              </span>
            </div>

            <div className="w-6 sm:w-10 md:w-16 h-0.5 bg-cream-300 dark:bg-[#4a5552] flex-shrink-0"></div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-cream-300 dark:bg-[#4a5552] text-forest-600 dark:text-[#8A9A8A] rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                2
              </div>
              <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-forest-500 dark:text-[#8A9A8A]">
                {locale === 'sv' ? 'Betalning' : 'Payment'}
              </span>
            </div>

            <div className="w-6 sm:w-10 md:w-16 h-0.5 bg-cream-300 dark:bg-[#4a5552] flex-shrink-0"></div>

            <div className="flex items-center">
              <div className="w-8 h-8 bg-cream-300 dark:bg-[#4a5552] text-forest-600 dark:text-[#8A9A8A] rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                3
              </div>
              <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm font-medium text-forest-500 dark:text-[#8A9A8A]">
                {locale === 'sv' ? 'Bekräftelse' : 'Confirmation'}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <CheckoutForm 
          locale={locale}
          onSuccess={() => {}}
        />

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-forest-600 dark:text-[#B8C5B8]">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>
              {locale === 'sv' 
                ? 'Säker betalning med SSL-kryptering'
                : 'Secure payment with SSL encryption'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}