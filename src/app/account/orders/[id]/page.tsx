'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PrinterIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

interface Address {
  firstName?: string;
  lastName?: string;
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
  const [cancelError, setCancelError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const { locale } = useLocale();

  const fetchOrder = useCallback(async (orderId: string) => {
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
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/account/orders/${orderId}`);
      return;
    }
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [session, status, router, params.id, fetchOrder]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const currentOrder = order;

    setCancelling(true);
    setCancelError('');
    try {
      const response = await fetch(`/api/orders/${currentOrder.id}`, {
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
        setOrder({ ...currentOrder, status: 'cancelled' });
        setShowCancelConfirm(false);
      } else {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel order');
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
        return <ArchiveBoxIcon className="w-6 h-6 text-green-600" />;
      case 'cancelled':
        return <XCircleIcon className="w-6 h-6 text-red-600" />;
      default:
        return <ClockIcon className="w-6 h-6 text-forest-600" />;
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
    return new Date(dateString).toLocaleString('sv-SE', {
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
    return ['pending', 'confirmed'].includes(order!.status.toLowerCase());
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
            <span className="ml-3 text-forest-600 dark:text-[#C5D4C5]">
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
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-lg inline-block">
              {error}
            </div>
            <div className="mt-6">
              <Link
                href="/account/orders"
                className="inline-flex items-center px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account/orders"
            className="inline-flex items-center text-sage-600 hover:text-sage-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Tillbaka till beställningar' : 'Back to orders'}
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8]">
                {locale === 'sv' ? 'Beställning' : 'Order'} #{order.id}
              </h1>
              <p className="text-forest-600 dark:text-[#C5D4C5] mt-2">
                {locale === 'sv' ? 'Beställd den' : 'Placed on'} {formatDate(order.createdAt)}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {getStatusIcon(order.status)}
              <span className="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8]">
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Items */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-forest-900 dark:text-[#E8EDE8] mb-6">
                {locale === 'sv' ? 'Beställda produkter' : 'Ordered products'}
              </h2>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-cream-200 dark:border-[#3f4946] rounded-lg">
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
                        <div className="w-20 h-20 bg-cream-200 dark:bg-[#2a3330] rounded-md flex items-center justify-center">
                          <span className="text-forest-400 dark:text-[#6B7B6B] text-xs">
                            {locale === 'sv' ? 'Ingen bild' : 'No image'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8]">
                        {locale === 'sv' && item.nameSwedish ? item.nameSwedish : item.name}
                      </h3>
                      {item.sku && (
                        <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">SKU: {item.sku}</p>
                      )}
                      <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                        {locale === 'sv' ? 'Antal:' : 'Quantity:'} {item.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-forest-900 dark:text-[#E8EDE8]">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                        {formatPrice(item.price)} {locale === 'sv' ? 'per st' : 'each'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
                  {locale === 'sv' ? 'Spårningsinformation' : 'Tracking information'}
                </h2>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-300">
                        {locale === 'sv' ? 'Spårningsnummer:' : 'Tracking number:'} {order.trackingNumber}
                      </p>
                      {order.estimatedDelivery && (
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          {locale === 'sv' ? 'Beräknad leverans:' : 'Estimated delivery:'} {formatDate(order.estimatedDelivery)}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/orders/track?tracking=${encodeURIComponent(order.trackingNumber)}`}
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
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
                {locale === 'sv' ? 'Ordersammanfattning' : 'Order summary'}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-forest-600 dark:text-[#C5D4C5]">
                    {locale === 'sv' ? 'Subtotal' : 'Subtotal'}
                  </span>
                  <span className="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-forest-600 dark:text-[#C5D4C5]">
                    {locale === 'sv' ? 'Moms (25%)' : 'VAT (25%)'}
                  </span>
                  <span className="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.tax)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-forest-600 dark:text-[#C5D4C5]">
                    {locale === 'sv' ? 'Frakt' : 'Shipping'}
                  </span>
                  <span className="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.shippingCost)}</span>
                </div>

                <hr className="border-cream-200 dark:border-[#3f4946]" />

                <div className="flex justify-between font-semibold text-lg">
                  <span className="text-forest-900 dark:text-[#E8EDE8]">
                    {locale === 'sv' ? 'Totalt' : 'Total'}
                  </span>
                  <span className="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
                {locale === 'sv' ? 'Betalningsinformation' : 'Payment information'}
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-forest-600 dark:text-[#C5D4C5]">
                    {locale === 'sv' ? 'Betalningsmetod:' : 'Payment method:'}
                  </span>
                  <span className="ml-2 text-forest-900 dark:text-[#E8EDE8] capitalize">{order.paymentMethod}</span>
                </div>

                <div>
                  <span className="text-forest-600 dark:text-[#C5D4C5]">
                    {locale === 'sv' ? 'Status:' : 'Status:'}
                  </span>
                  <span className="ml-2 text-forest-900 dark:text-[#E8EDE8] capitalize">{order.paymentStatus || '—'}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
                {locale === 'sv' ? 'Leveransadress' : 'Shipping address'}
              </h3>

              <div className="text-forest-700 dark:text-[#C5D4C5]">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
                {locale === 'sv' ? 'Faktureringsadress' : 'Billing address'}
              </h3>

              {order.billingAddress.street === order.shippingAddress.street &&
               order.billingAddress.city === order.shippingAddress.city ? (
                <p className="text-forest-500 dark:text-[#8A9A8A] text-sm italic">
                  {locale === 'sv' ? 'Samma som leveransadress' : 'Same as shipping address'}
                </p>
              ) : (
                <div className="text-forest-700 dark:text-[#C5D4C5]">
                  <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                  <p>{order.billingAddress.street}</p>
                  <p>{order.billingAddress.postalCode} {order.billingAddress.city}</p>
                  <p>{order.billingAddress.country}</p>
                  {order.billingAddress.phone && <p>{order.billingAddress.phone}</p>}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {canCancel() && (
                <>
                  {showCancelConfirm ? (
                    <div className="border border-red-300 dark:border-red-800 rounded-lg p-4 space-y-3">
                      <p className="text-sm text-forest-700 dark:text-[#C5D4C5] font-medium">
                        {locale === 'sv'
                          ? 'Är du säker på att du vill avbryta beställningen?'
                          : 'Are you sure you want to cancel this order?'}
                      </p>
                      {cancelError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{cancelError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleCancelOrder}
                          disabled={cancelling}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {cancelling
                            ? (locale === 'sv' ? 'Avbryter...' : 'Cancelling...')
                            : (locale === 'sv' ? 'Ja, avbryt' : 'Yes, cancel')}
                        </button>
                        <button
                          onClick={() => { setShowCancelConfirm(false); setCancelError(''); }}
                          disabled={cancelling}
                          className="flex-1 px-3 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] text-sm font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330] disabled:opacity-50 transition-colors"
                        >
                          {locale === 'sv' ? 'Nej, behåll' : 'No, keep it'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {locale === 'sv' ? 'Avbryt beställning' : 'Cancel order'}
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                {locale === 'sv' ? 'Skriv ut kvitto' : 'Print receipt'}
              </button>

              <Link
                href="/contact"
                className="w-full text-center px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors block"
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
