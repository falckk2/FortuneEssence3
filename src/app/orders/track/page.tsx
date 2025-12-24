'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, TruckIcon, ArchiveBoxIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const locale = 'sv'; // This would come from context in a real app

  const getTrackingUrl = (carrier: string, trackingNumber: string) => {
    const lowerCarrier = carrier?.toLowerCase() || '';

    if (lowerCarrier.includes('postnord')) {
      return `https://www.postnord.se/sv/verktyg/spara/sok-spara?shipmentId=${trackingNumber}`;
    } else if (lowerCarrier.includes('dhl')) {
      return `https://www.dhl.com/se-sv/home/tracking.html?tracking-id=${trackingNumber}`;
    } else if (lowerCarrier.includes('bring')) {
      return `https://tracking.bring.com/tracking/${trackingNumber}`;
    } else if (lowerCarrier.includes('ups')) {
      return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    } else if (lowerCarrier.includes('fedex')) {
      return `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`;
    }

    // Default to PostNord if no carrier specified
    return `https://www.postnord.se/sv/verktyg/spara/sok-spara?shipmentId=${trackingNumber}`;
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const response = await fetch(`/api/orders?action=track-by-order&orderNumber=${encodeURIComponent(orderNumber.trim())}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find order');
      }

      if (data.success) {
        setOrderData(data.data);
      } else {
        setError(data.error || 'Order not found');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find order');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'shipped':
      case 'under transport':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
      case 'förbereds för transport':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <ArchiveBoxIcon className="w-5 h-5" />;
      case 'shipped':
      case 'under transport':
        return <TruckIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Tillbaka till start' : 'Back to home'}
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {locale === 'sv' ? 'Spåra din beställning' : 'Track your order'}
          </h1>
          <p className="text-gray-600 mt-2">
            {locale === 'sv'
              ? 'Ange ditt ordernummer för att se spårningsinformation'
              : 'Enter your order number to see tracking information'
            }
          </p>
        </div>

        {/* Tracking Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === 'sv' ? 'Ordernummer' : 'Order number'}
                </label>
                <input
                  id="orderNumber"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder={locale === 'sv' ? 'Ange ordernummer' : 'Enter order number'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  {locale === 'sv'
                    ? 'Du hittar ordernumret i orderbekräftelsen som skickades till din e-post'
                    : 'You can find the order number in the order confirmation sent to your email'
                  }
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !orderNumber.trim()}
                className="w-full bg-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? (locale === 'sv' ? 'Söker...' : 'Searching...')
                  : (locale === 'sv' ? 'Hitta beställning' : 'Find order')
                }
              </button>
            </form>
          </div>

          {/* Tracking Results */}
          {orderData && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {locale === 'sv' ? 'Beställningsinformation' : 'Order information'}
                </h2>

                {/* Current Status */}
                <div className="bg-gradient-to-r from-purple-50 to-yellow-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {locale === 'sv' ? 'Aktuell status' : 'Current status'}
                      </h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                        {getStatusIcon(orderData.status)}
                        <span className="ml-2 capitalize">{orderData.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {locale === 'sv' ? 'Orderdetaljer' : 'Order details'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        {locale === 'sv' ? 'Ordernummer' : 'Order number'}
                      </p>
                      <p className="font-medium text-gray-900">#{orderData.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {locale === 'sv' ? 'Orderdatum' : 'Order date'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {formatDate(orderData.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {locale === 'sv' ? 'Totalt' : 'Total'}
                      </p>
                      <p className="font-medium text-gray-900">{orderData.total} SEK</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        {locale === 'sv' ? 'Fraktfirma' : 'Carrier'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {orderData.carrier || 'PostNord'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tracking Information */}
                {orderData.trackingNumber ? (
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {locale === 'sv' ? 'Spårningsinformation' : 'Tracking information'}
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        {locale === 'sv' ? 'Spårningsnummer:' : 'Tracking number:'}
                      </p>
                      <p className="font-mono font-semibold text-gray-900 text-lg mb-4">
                        {orderData.trackingNumber}
                      </p>
                      <a
                        href={getTrackingUrl(orderData.carrier || 'PostNord', orderData.trackingNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <TruckIcon className="w-5 h-5 mr-2" />
                        {locale === 'sv' ? 'Spåra paket på ' : 'Track package on '}
                        {orderData.carrier || 'PostNord'}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        {locale === 'sv'
                          ? 'Spårningsnummer har ännu inte tilldelats. Detta kommer att uppdateras när din beställning har skickats.'
                          : 'Tracking number has not been assigned yet. This will be updated when your order has been shipped.'
                        }
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Link
                  href="/account/orders"
                  className="flex-1 text-center px-6 py-3 border border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
                >
                  {locale === 'sv' ? 'Visa alla beställningar' : 'View all orders'}
                </Link>
                
                <Link
                  href="/contact"
                  className="flex-1 text-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {locale === 'sv' ? 'Kontakta kundservice' : 'Contact support'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}