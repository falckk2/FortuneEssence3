'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function CheckoutSuccessPage() {
  const [orderNumber, setOrderNumber] = useState<string>('');
  const locale = 'sv'; // This would come from context in a real app

  useEffect(() => {
    // Generate a mock order number for display
    const mockOrderNumber = `FE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setOrderNumber(mockOrderNumber);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
              <CheckCircleIcon className="w-16 h-16 text-green-600" />
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {locale === 'sv' ? 'Tack för din beställning!' : 'Thank you for your order!'}
            </h1>
            
            <p className="text-xl text-gray-600 mb-2">
              {locale === 'sv' 
                ? 'Din beställning har tagits emot och bekräftelse skickas till din e-post.'
                : 'Your order has been received and confirmation will be sent to your email.'
              }
            </p>
            
            {orderNumber && (
              <p className="text-lg font-semibold text-purple-600">
                {locale === 'sv' ? 'Ordernummer:' : 'Order number:'} {orderNumber}
              </p>
            )}
          </div>

          {/* Order Details Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-left">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              {locale === 'sv' ? 'Vad händer nu?' : 'What happens next?'}
            </h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-purple-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {locale === 'sv' ? 'Orderbekräftelse' : 'Order Confirmation'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'sv' 
                      ? 'Du får en e-post med orderdetaljer och leveransinformation inom några minuter.'
                      : 'You will receive an email with order details and shipping information within minutes.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-purple-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {locale === 'sv' ? 'Bearbetning' : 'Processing'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'sv' 
                      ? 'Vi plockar och packar din beställning inom 1-2 arbetsdagar.'
                      : 'We pick and pack your order within 1-2 business days.'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 mt-1">
                  <span className="text-purple-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {locale === 'sv' ? 'Leverans' : 'Delivery'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {locale === 'sv' 
                      ? 'Du får ett spårningsnummer när paketet skickas och kan följa leveransen.'
                      : 'You will receive a tracking number when the package is shipped and can follow the delivery.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Support */}
          <div className="bg-gradient-to-r from-purple-50 to-yellow-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'sv' ? 'Behöver du hjälp?' : 'Need help?'}
            </h3>
            <p className="text-gray-600 mb-4">
              {locale === 'sv' 
                ? 'Vårt kundtjänstteam är här för att hjälpa dig med alla frågor om din beställning.'
                : 'Our customer service team is here to help you with any questions about your order.'
              }
            </p>
            <Link 
              href="/contact"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center px-8 py-3 border-2 border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
            >
              {locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
            </Link>
            
            <Link
              href="/account/orders"
              className="inline-flex items-center px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              {locale === 'sv' ? 'Se mina beställningar' : 'View my orders'}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Newsletter Signup */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {locale === 'sv' ? 'Få exklusiva erbjudanden' : 'Get exclusive offers'}
            </h3>
            <p className="text-gray-600 mb-4">
              {locale === 'sv' 
                ? 'Prenumerera på vårt nyhetsbrev och få 10% rabatt på din nästa beställning.'
                : 'Subscribe to our newsletter and get 10% off your next order.'
              }
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder={locale === 'sv' ? 'Din e-postadress' : 'Your email address'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <button
                type="submit"
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                {locale === 'sv' ? 'Prenumerera' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}