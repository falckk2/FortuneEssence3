'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  EnvelopeIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useLocale } from '@/contexts/LocaleContext';

interface TrackingEvent {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
  trackingHistory: TrackingEvent[];
}

function TrackOrderContent() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const [searchType, setSearchType] = useState<'order' | 'tracking'>('order');
  const [searchValue, setSearchValue] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (
    type: 'order' | 'tracking',
    value: string,
    emailValue: string
  ) => {
    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const endpoint = type === 'order'
        ? `/api/orders/track?orderId=${encodeURIComponent(value.trim())}&email=${encodeURIComponent(emailValue.trim())}`
        : `/api/orders/track?trackingNumber=${encodeURIComponent(value.trim())}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success && data.data) {
        setOrderData(data.data);
      } else {
        const message = type === 'order'
          ? (locale === 'sv'
              ? 'Ingen order hittades med det ordernumret och den e-postadressen.'
              : 'No order was found with that order number and email address.')
          : (locale === 'sv'
              ? 'Order hittades inte. Kontrollera numret och försök igen.'
              : 'Order not found. Check the number and try again.');
        setError(message);
        toast.error(message);
      }
    } catch (err) {
      console.error('Failed to track order:', err);
      const message = locale === 'sv' ? 'Ett fel uppstod vid sökning' : 'Something went wrong while searching';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // Links from order emails and account pages land here with ?tracking=NUMBER —
  // prefill and search immediately so the user sees their shipment without retyping.
  useEffect(() => {
    const trackingParam = searchParams.get('tracking') || searchParams.get('trackingNumber');
    if (trackingParam) {
      setSearchType('tracking');
      setSearchValue(trackingParam);
      performSearch('tracking', trackingParam, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      toast.error(locale === 'sv'
        ? 'Vänligen ange ett ordernummer eller spårningsnummer'
        : 'Please enter an order number or tracking number');
      return;
    }

    if (searchType === 'order' && !email.trim()) {
      toast.error(locale === 'sv'
        ? 'Vänligen ange e-postadressen som användes vid beställningen'
        : 'Please enter the email address used when ordering');
      return;
    }

    await performSearch(searchType, searchValue, email);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'processing': 'bg-sage-100 text-sage-800 border-sage-200',
      'shipped': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-cream-100 text-forest-800 border-cream-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return <ClockIcon className="h-6 w-6" />;
      case 'processing':
        return <ShoppingBagIcon className="h-6 w-6" />;
      case 'shipped':
        return <TruckIcon className="h-6 w-6" />;
      case 'delivered':
        return <CheckCircleIcon className="h-6 w-6" />;
      case 'cancelled':
        return <ExclamationCircleIcon className="h-6 w-6" />;
      default:
        return <ClockIcon className="h-6 w-6" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: { sv: string; en: string } } = {
      'pending': { sv: 'Väntande', en: 'Pending' },
      'confirmed': { sv: 'Bekräftad', en: 'Confirmed' },
      'processing': { sv: 'Behandlas', en: 'Processing' },
      'shipped': { sv: 'Skickad', en: 'Shipped' },
      'delivered': { sv: 'Levererad', en: 'Delivered' },
      'cancelled': { sv: 'Avbruten', en: 'Cancelled' },
    };
    return labels[status]?.[locale] || status;
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#1a1f1e]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sage-600 to-forest-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <TruckIcon className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              {locale === 'sv' ? 'Spåra din beställning' : 'Track your order'}
            </h1>
            <p className="text-xl text-cream-100 mb-8">
              {locale === 'sv'
                ? 'Ange ditt ordernummer och e-postadress, eller ditt spårningsnummer'
                : 'Enter your order number and email address, or your tracking number'}
            </p>

            {/* Search Form */}
            <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-2xl p-6">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setSearchType('order')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    searchType === 'order'
                      ? 'bg-sage-600 text-white'
                      : 'bg-cream-100 dark:bg-[#2a3330] text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-200 dark:hover:bg-[#343c39]'
                  }`}
                >
                  {locale === 'sv' ? 'Ordernummer' : 'Order number'}
                </button>
                <button
                  onClick={() => setSearchType('tracking')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    searchType === 'tracking'
                      ? 'bg-sage-600 text-white'
                      : 'bg-cream-100 dark:bg-[#2a3330] text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-200 dark:hover:bg-[#343c39]'
                  }`}
                >
                  {locale === 'sv' ? 'Spårningsnummer' : 'Tracking number'}
                </button>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      searchType === 'order'
                        ? (locale === 'sv' ? 'Ange ordernummer (t.ex. ORD-12345)' : 'Enter order number (e.g. ORD-12345)')
                        : (locale === 'sv' ? 'Ange spårningsnummer (t.ex. 1234567890)' : 'Enter tracking number (e.g. 1234567890)')
                    }
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-forest-800 dark:text-[#E8EDE8] dark:bg-[#1a1f1e] border-2 border-cream-300 dark:border-[#3f4946] focus:border-sage-600 focus:outline-none text-lg"
                  />
                </div>

                {searchType === 'order' && (
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={locale === 'sv'
                        ? 'E-postadress som användes vid beställningen'
                        : 'Email address used when ordering'}
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-forest-800 dark:text-[#E8EDE8] dark:bg-[#1a1f1e] border-2 border-cream-300 dark:border-[#3f4946] focus:border-sage-600 focus:outline-none text-lg"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 rounded-xl bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {locale === 'sv' ? 'Söker...' : 'Searching...'}
                    </div>
                  ) : (
                    locale === 'sv' ? 'Spåra beställning' : 'Track order'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Error State */}
          {error && !orderData && (
            <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
              <ExclamationCircleIcon className="h-16 w-16 mx-auto mb-4 text-red-600 dark:text-red-400" />
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">
                {locale === 'sv' ? 'Order hittades inte' : 'Order not found'}
              </h2>
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Order Data */}
          {orderData && (
            <div className="space-y-6">
              {/* Order Status Card */}
              <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8] mb-1">
                      Order #{orderData.orderNumber}
                    </h2>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(orderData.status)}`}>
                    {getStatusIcon(orderData.status)}
                    <span className="font-semibold">{getStatusLabel(orderData.status)}</span>
                  </div>
                </div>

                {/* Tracking Info */}
                {orderData.trackingNumber ? (
                  <div className="bg-cream-50 dark:bg-[#1a1f1e] rounded-xl p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">
                          {locale === 'sv' ? 'Spårningsnummer' : 'Tracking number'}
                        </p>
                        <p className="font-mono font-bold text-forest-800 dark:text-[#E8EDE8]">
                          {orderData.trackingNumber}
                        </p>
                      </div>
                      {orderData.carrier && (
                        <div>
                          <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">
                            {locale === 'sv' ? 'Fraktbolag' : 'Carrier'}
                          </p>
                          <p className="font-semibold text-forest-800 dark:text-[#E8EDE8]">{orderData.carrier}</p>
                        </div>
                      )}
                    </div>
                    {orderData.estimatedDelivery && (
                      <div className="mt-4 pt-4 border-t border-cream-200 dark:border-[#3f4946]">
                        <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">
                          {locale === 'sv' ? 'Beräknad leverans' : 'Estimated delivery'}
                        </p>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-5 w-5 text-sage-600 dark:text-sage-400" />
                          <p className="font-semibold text-forest-800 dark:text-[#E8EDE8]">
                            {new Date(orderData.estimatedDelivery).toLocaleDateString(locale === 'sv' ? 'sv-SE' : 'en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-forest-600 dark:text-[#8A9A8A]">
                    {locale === 'sv'
                      ? 'Din beställning har inte skickats ännu. Spårningsinformation visas här när paketet är på väg.'
                      : 'Your order has not been shipped yet. Tracking information will appear here once the package is on its way.'}
                  </p>
                )}
              </div>

              {/* Tracking History */}
              {orderData.trackingHistory && orderData.trackingHistory.length > 0 && (
                <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 md:p-8">
                  <h3 className="font-bold text-forest-800 dark:text-[#E8EDE8] text-xl mb-6">
                    {locale === 'sv' ? 'Spårningshistorik' : 'Tracking history'}
                  </h3>
                  <div className="space-y-4">
                    {orderData.trackingHistory.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-sage-600' : 'bg-cream-300 dark:bg-[#3f4946]'
                            }`}
                          />
                          {index < orderData.trackingHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-cream-300 dark:bg-[#3f4946] mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="font-semibold text-forest-800 dark:text-[#E8EDE8]">{event.status}</p>
                          <p className="text-forest-700 dark:text-[#C5D4C5] mb-1">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-forest-600 dark:text-[#8A9A8A]">
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {new Date(event.timestamp).toLocaleString(locale === 'sv' ? 'sv-SE' : 'en-GB')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 dark:bg-[#1a1f1e]" />}>
      <TrackOrderContent />
    </Suspense>
  );
}
