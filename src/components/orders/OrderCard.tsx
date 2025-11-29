'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  TruckIcon, 
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    createdAt: string;
    totalAmount: number;
    items: Array<{
      id: string;
      name: string;
      nameSwedish?: string;
      quantity: number;
      price: number;
      imageUrl?: string;
    }>;
    trackingNumber?: string;
    estimatedDelivery?: string;
  };
  locale?: string;
  onCancel?: (orderId: string) => void;
}

export function OrderCard({ order, locale = 'sv', onCancel }: OrderCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'shipped':
        return <TruckIcon className="w-5 h-5 text-blue-600" />;
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'confirmed':
        return 'text-green-700 bg-green-100';
      case 'shipped':
        return 'text-blue-700 bg-blue-100';
      case 'delivered':
        return 'text-green-700 bg-green-100';
      case 'cancelled':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
    }).format(price);
  };

  const canCancel = () => {
    return ['pending', 'confirmed'].includes(order.status.toLowerCase());
  };

  const handleCancel = async () => {
    if (!onCancel || !canCancel()) return;
    
    setCancelling(true);
    try {
      await onCancel(order.id);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Order Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(order.status)}
            <div>
              <p className="font-semibold text-gray-900">
                {locale === 'sv' ? 'Beställning' : 'Order'} #{order.id}
              </p>
              <p className="text-sm text-gray-600">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </div>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {formatPrice(order.totalAmount)}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              {order.items.length} {locale === 'sv' ? 'artiklar' : 'items'}
            </p>
            {order.trackingNumber && (
              <p className="text-sm text-purple-600">
                {locale === 'sv' ? 'Spårning:' : 'Tracking:'} {order.trackingNumber}
              </p>
            )}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            {expanded 
              ? (locale === 'sv' ? 'Dölj detaljer' : 'Hide details')
              : (locale === 'sv' ? 'Visa detaljer' : 'Show details')
            }
            {expanded ? (
              <ChevronUpIcon className="w-4 h-4 ml-1" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-6">
            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={60}
                        height={60}
                        className="w-15 h-15 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-15 h-15 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Ingen bild</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {locale === 'sv' && item.nameSwedish ? item.nameSwedish : item.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {locale === 'sv' ? 'Antal:' : 'Quantity:'} {item.quantity}
                    </p>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Estimated Delivery */}
            {order.estimatedDelivery && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {locale === 'sv' ? 'Beräknad leverans' : 'Estimated delivery'}
                </p>
                <p className="text-sm text-blue-700">
                  {formatDate(order.estimatedDelivery)}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {order.trackingNumber && (
                <Link
                  href={`/orders/track?tracking=${order.trackingNumber}`}
                  className="flex-1 text-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {locale === 'sv' ? 'Spåra paket' : 'Track package'}
                </Link>
              )}
              
              <Link
                href={`/account/orders/${order.id}`}
                className="flex-1 text-center px-4 py-2 border border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
              >
                {locale === 'sv' ? 'Visa detaljer' : 'View details'}
              </Link>
              
              {canCancel() && onCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {cancelling 
                    ? (locale === 'sv' ? 'Avbryter...' : 'Cancelling...')
                    : (locale === 'sv' ? 'Avbryt order' : 'Cancel order')
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}