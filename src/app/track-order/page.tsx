'use client';

import { useState } from 'react';
import {
  MagnifyingGlassIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

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
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  items: OrderItem[];
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  trackingHistory: TrackingEvent[];
}

export default function TrackOrderPage() {
  const [searchType, setSearchType] = useState<'order' | 'tracking'>('order');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderTrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      toast.error('Vänligen ange ett ordernummer eller spårningsnummer');
      return;
    }

    setLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const endpoint = searchType === 'order'
        ? `/api/orders/track?orderId=${encodeURIComponent(searchValue)}`
        : `/api/orders/track?trackingNumber=${encodeURIComponent(searchValue)}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success && data.data) {
        setOrderData(data.data);
      } else {
        setError(data.error || 'Order hittades inte');
        toast.error(data.error || 'Order hittades inte');
      }
    } catch (err) {
      console.error('Failed to track order:', err);
      setError('Ett fel uppstod vid sökning');
      toast.error('Ett fel uppstod vid sökning');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'processing': 'bg-purple-100 text-purple-800 border-purple-200',
      'shipped': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
    const labels: { [key: string]: string } = {
      'pending': 'Väntande',
      'confirmed': 'Bekräftad',
      'processing': 'Behandlas',
      'shipped': 'Skickad',
      'delivered': 'Levererad',
      'cancelled': 'Avbruten',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sage-600 to-forest-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <TruckIcon className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Spåra din beställning
            </h1>
            <p className="text-xl text-cream-100 mb-8">
              Ange ditt ordernummer eller spårningsnummer för att se var ditt paket befinner sig
            </p>

            {/* Search Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setSearchType('order')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    searchType === 'order'
                      ? 'bg-sage-600 text-white'
                      : 'bg-cream-100 text-forest-700 hover:bg-cream-200'
                  }`}
                >
                  Ordernummer
                </button>
                <button
                  onClick={() => setSearchType('tracking')}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                    searchType === 'tracking'
                      ? 'bg-sage-600 text-white'
                      : 'bg-cream-100 text-forest-700 hover:bg-cream-200'
                  }`}
                >
                  Spårningsnummer
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
                        ? 'Ange ordernummer (t.ex. ORD-12345)'
                        : 'Ange spårningsnummer (t.ex. 1234567890)'
                    }
                    className="w-full pl-12 pr-4 py-4 rounded-xl text-forest-800 border-2 border-cream-300 focus:border-sage-600 focus:outline-none text-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 rounded-xl bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Söker...
                    </div>
                  ) : (
                    'Spåra beställning'
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
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
              <ExclamationCircleIcon className="h-16 w-16 mx-auto mb-4 text-red-600" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">Order hittades inte</h2>
              <p className="text-red-700">
                Kontrollera att du angett rätt ordernummer eller spårningsnummer och försök igen.
              </p>
            </div>
          )}

          {/* Order Data */}
          {orderData && (
            <div className="space-y-6">
              {/* Order Status Card */}
              <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-forest-800 mb-1">
                      Order #{orderData.orderNumber}
                    </h2>
                    <p className="text-forest-600">Order-ID: {orderData.orderId}</p>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(orderData.status)}`}>
                    {getStatusIcon(orderData.status)}
                    <span className="font-semibold">{getStatusLabel(orderData.status)}</span>
                  </div>
                </div>

                {/* Tracking Info */}
                {orderData.trackingNumber && (
                  <div className="bg-cream-50 rounded-xl p-6 mb-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-forest-600 mb-1">Spårningsnummer</p>
                        <p className="font-mono font-bold text-forest-800">
                          {orderData.trackingNumber}
                        </p>
                      </div>
                      {orderData.carrier && (
                        <div>
                          <p className="text-sm text-forest-600 mb-1">Fraktbolag</p>
                          <p className="font-semibold text-forest-800">{orderData.carrier}</p>
                        </div>
                      )}
                    </div>
                    {orderData.estimatedDelivery && (
                      <div className="mt-4 pt-4 border-t border-cream-200">
                        <p className="text-sm text-forest-600 mb-1">Beräknad leverans</p>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-5 w-5 text-sage-600" />
                          <p className="font-semibold text-forest-800">
                            {new Date(orderData.estimatedDelivery).toLocaleDateString('sv-SE', {
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
                )}

                {/* Delivery Address */}
                <div className="mb-6">
                  <h3 className="font-semibold text-forest-800 mb-3 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-sage-600" />
                    Leveransadress
                  </h3>
                  <div className="bg-cream-50 rounded-xl p-4">
                    <p className="text-forest-700">{orderData.shippingAddress.street}</p>
                    <p className="text-forest-700">
                      {orderData.shippingAddress.postalCode} {orderData.shippingAddress.city}
                    </p>
                    <p className="text-forest-700">{orderData.shippingAddress.country}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold text-forest-800 mb-3 flex items-center gap-2">
                    <ShoppingBagIcon className="h-5 w-5 text-sage-600" />
                    Produkter ({orderData.items.length})
                  </h3>
                  <div className="space-y-3">
                    {orderData.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-cream-50 rounded-xl p-4"
                      >
                        <div>
                          <p className="font-medium text-forest-800">{item.productName}</p>
                          <p className="text-sm text-forest-600">Antal: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-forest-800">
                          {(item.price * item.quantity).toFixed(2)} kr
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-cream-200 flex items-center justify-between">
                    <p className="font-bold text-forest-800 text-lg">Totalt</p>
                    <p className="font-bold text-forest-800 text-2xl">
                      {orderData.total.toFixed(2)} kr
                    </p>
                  </div>
                </div>
              </div>

              {/* Tracking History */}
              {orderData.trackingHistory && orderData.trackingHistory.length > 0 && (
                <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8">
                  <h3 className="font-bold text-forest-800 text-xl mb-6">Spårningshistorik</h3>
                  <div className="space-y-4">
                    {orderData.trackingHistory.map((event, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              index === 0 ? 'bg-sage-600' : 'bg-cream-300'
                            }`}
                          />
                          {index < orderData.trackingHistory.length - 1 && (
                            <div className="w-0.5 h-full bg-cream-300 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="font-semibold text-forest-800">{event.status}</p>
                          <p className="text-forest-700 mb-1">{event.description}</p>
                          <div className="flex items-center gap-4 text-sm text-forest-600">
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="h-4 w-4" />
                              {event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {new Date(event.timestamp).toLocaleString('sv-SE')}
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
