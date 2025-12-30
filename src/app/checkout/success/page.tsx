'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircleIcon, ArrowRightIcon, DocumentArrowDownIcon, TruckIcon } from '@heroicons/react/24/outline';

interface ShippingLabel {
  trackingNumber: string;
  carrierCode: string;
  labelUrl: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [shippingLabel, setShippingLabel] = useState<ShippingLabel | null>(null);
  const [carrierName, setCarrierName] = useState<string>('');
  const [isLoadingLabel, setIsLoadingLabel] = useState(false);
  const locale = 'sv'; // This would come from context in a real app

  useEffect(() => {
    const orderId = searchParams.get('orderId');

    if (orderId) {
      setOrderNumber(orderId.slice(0, 13).toUpperCase());

      // Fetch shipping label
      const fetchLabel = async () => {
        setIsLoadingLabel(true);
        try {
          const response = await fetch(`/api/shipping/labels?orderId=${orderId}`);
          const result = await response.json();

          if (result.success && result.data) {
            setShippingLabel(result.data);

            // Map carrier code to name
            const carrierNames: Record<string, string> = {
              'POSTNORD': 'PostNord',
              'DHL': 'DHL',
              'BRING': 'Bring',
              'DB_SCHENKER': 'DB Schenker',
              'INSTABEE': 'Instabee',
              'BUDBEE': 'Budbee',
              'INSTABOX': 'Instabox',
              'EARLY_BIRD': 'Early Bird',
            };
            setCarrierName(carrierNames[result.data.carrierCode] || result.data.carrierCode);
          }
        } catch (error) {
          console.error('Failed to fetch shipping label:', error);
        } finally {
          setIsLoadingLabel(false);
        }
      };

      fetchLabel();
    } else {
      // Generate a mock order number for display
      const mockOrderNumber = `FE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setOrderNumber(mockOrderNumber);
    }
  }, [searchParams]);

  const handleDownloadLabel = () => {
    if (shippingLabel) {
      const orderId = searchParams.get('orderId');
      window.open(`/api/shipping/labels/download?orderId=${orderId}`, '_blank');
    }
  };

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

          {/* Shipping Label Card */}
          {shippingLabel && (
            <div className="bg-gradient-to-r from-sage-50 to-green-50 rounded-xl shadow-lg p-6 mb-8 text-left border-2 border-sage-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-sage-600 rounded-full p-3">
                    <TruckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-forest-800">
                      {locale === 'sv' ? 'Spårningsinformation' : 'Tracking Information'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {carrierName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadLabel}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  {locale === 'sv' ? 'Ladda ner etikett' : 'Download Label'}
                </button>
              </div>

              <div className="bg-white rounded-lg p-4 border border-sage-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {locale === 'sv' ? 'Spårningsnummer' : 'Tracking Number'}
                    </p>
                    <p className="text-xl font-mono font-bold text-forest-800">
                      {shippingLabel.trackingNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(shippingLabel.trackingNumber)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    {locale === 'sv' ? 'Kopiera' : 'Copy'}
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                {locale === 'sv'
                  ? 'Du kan spåra din leverans med detta nummer när paketet har skickats.'
                  : 'You can track your delivery with this number once the package has been shipped.'
                }
              </p>
            </div>
          )}

          {isLoadingLabel && !shippingLabel && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-600 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {locale === 'sv' ? 'Genererar fraktetikett...' : 'Generating shipping label...'}
              </p>
            </div>
          )}

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

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}