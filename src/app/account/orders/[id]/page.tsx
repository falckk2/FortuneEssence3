'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  name?: string;
  phone?: string;
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  estimatedDelivery?: string;
  items: Array<{
    id: string;
    name: string;
    nameSwedish?: string;
    quantity: number;
    price: number;
    imageUrl?: string;
    sku?: string;
  }>;
}

export default function OrderDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const locale = 'sv'; // This would come from context in a real app

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account/orders');
      return;
    }
    
    if (params?.id) {
      fetchOrder(params.id as string);
    }
  }, [session, status, router, params?.id]);

  const fetchOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error('Order not found');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.error || 'Failed to load order');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrder({ ...order, status: 'cancelled' });
      } else {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-6 h-6 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'shipped':
        return <TruckIcon className="w-6 h-6 text-blue-600" />;
      case 'delivered':
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case 'cancelled':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      default:
        return <ClockIcon className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      pending: locale === 'sv' ? 'Väntar' : 'Pending',
      confirmed: locale === 'sv' ? 'Bekräftad' : 'Confirmed',
      shipped: locale === 'sv' ? 'Skickad' : 'Shipped',
      delivered: locale === 'sv' ? 'Levererad' : 'Delivered',
      cancelled: locale === 'sv' ? 'Avbruten' : 'Cancelled',
    };
    return statusMap[status.toLowerCase() as keyof typeof statusMap] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
    }).format(price);
  };

  const canCancel = () => {
    return order && ['pending', 'confirmed'].includes(order.status.toLowerCase());
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">
              {locale === 'sv' ? 'Laddar beställning...' : 'Loading order...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-lg inline-block">
              {error}
            </div>
            <div className="mt-6">
              <Link
                href="/account/orders"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                {locale === 'sv' ? 'Tillbaka till beställningar' : 'Back to orders'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/account/orders"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Tillbaka till beställningar' : 'Back to orders'}
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {locale === 'sv' ? 'Beställning' : 'Order'} #{order.id}
              </h1>
              <p className="text-gray-600 mt-2">
                {locale === 'sv' ? 'Beställd den' : 'Placed on'} {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <span className="text-lg font-semibold text-gray-900">
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {locale === 'sv' ? 'Beställda produkter' : 'Ordered products'}
              </h2>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs">Ingen bild</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">
                        {locale === 'sv' && item.nameSwedish ? item.nameSwedish : item.name}
                      </h3>
                      {item.sku && (
                        <p className="text-sm text-gray-600">SKU: {item.sku}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {locale === 'sv' ? 'Antal:' : 'Quantity:'} {item.quantity}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(item.price)} {locale === 'sv' ? 'per st' : 'each'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {locale === 'sv' ? 'Spårningsinformation' : 'Tracking information'}
                </h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">
                        {locale === 'sv' ? 'Spårningsnummer:' : 'Tracking number:'} {order.trackingNumber}
                      </p>
                      {order.estimatedDelivery && (
                        <p className="text-sm text-blue-700 mt-1">
                          {locale === 'sv' ? 'Beräknad leverans:' : 'Estimated delivery:'} {formatDate(order.estimatedDelivery)}
                        </p>
                      )}
                    </div>
                    
                    <Link
                      href={`/orders/track?tracking=${order.trackingNumber}`}
                      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {locale === 'sv' ? 'Spåra paket' : 'Track package'}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'sv' ? 'Ordersammanfattning' : 'Order summary'}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {locale === 'sv' ? 'Subtotal' : 'Subtotal'}
                  </span>
                  <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {locale === 'sv' ? 'Moms (25%)' : 'VAT (25%)'}
                  </span>
                  <span className="text-gray-900">{formatPrice(order.tax)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {locale === 'sv' ? 'Frakt' : 'Shipping'}
                  </span>
                  <span className="text-gray-900">{formatPrice(order.shippingCost)}</span>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-gray-900">
                    {locale === 'sv' ? 'Totalt' : 'Total'}
                  </span>
                  <span className="text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'sv' ? 'Betalningsinformation' : 'Payment information'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600">
                    {locale === 'sv' ? 'Betalningsmetod:' : 'Payment method:'}
                  </span>
                  <span className="ml-2 text-gray-900 capitalize">{order.paymentMethod}</span>
                </div>
                
                <div>
                  <span className="text-gray-600">
                    {locale === 'sv' ? 'Status:' : 'Status:'}
                  </span>
                  <span className="ml-2 text-gray-900 capitalize">{order.paymentStatus || 'Completed'}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'sv' ? 'Leveransadress' : 'Shipping address'}
              </h3>
              
              <div className="text-gray-700">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {canCancel() && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="w-full px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelling 
                    ? (locale === 'sv' ? 'Avbryter...' : 'Cancelling...')
                    : (locale === 'sv' ? 'Avbryt beställning' : 'Cancel order')
                  }
                </button>
              )}
              
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                <PrinterIcon className="h-4 w-4 mr-2" />
                {locale === 'sv' ? 'Skriv ut kvitto' : 'Print receipt'}
              </button>
              
              <Link
                href="/contact"
                className="w-full text-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors block"
              >
                {locale === 'sv' ? 'Kontakta support' : 'Contact support'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}