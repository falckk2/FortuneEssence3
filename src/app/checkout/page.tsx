'use client';

import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CheckoutPage() {
  const locale = 'sv'; // This would come from context in a real app

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/products"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {locale === 'sv' ? 'Kassa' : 'Checkout'}
          </h1>
          <p className="text-gray-600 mt-2">
            {locale === 'sv' 
              ? 'Slutför din beställning säkert och enkelt'
              : 'Complete your order securely and easily'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">
                {locale === 'sv' ? 'Information' : 'Information'}
              </span>
            </div>
            
            <div className="w-16 h-0.5 bg-gray-300"></div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">
                {locale === 'sv' ? 'Betalning' : 'Payment'}
              </span>
            </div>
            
            <div className="w-16 h-0.5 bg-gray-300"></div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-500">
                {locale === 'sv' ? 'Bekräftelse' : 'Confirmation'}
              </span>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <CheckoutForm 
          locale={locale}
          onSuccess={(orderId) => {
            console.log('Order completed:', orderId);
          }}
        />

        {/* Security Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
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