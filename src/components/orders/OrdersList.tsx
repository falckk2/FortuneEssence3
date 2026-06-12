'use client';

import { useState, useEffect } from 'react';
import Link from '@/components/i18n/Link';
import { OrderCard } from './OrderCard';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface Order {
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
}

interface OrdersListProps {
  locale?: string;
}

export function OrdersList({ locale = 'sv' }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders?action=user-orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
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
        // Update the order in the list
        setOrders(prev => 
          prev.map(order => 
            order.id === orderId 
              ? { ...order, status: 'cancelled' }
              : order
          )
        );
      } else {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status.toLowerCase() === filter;
  });

  const getFilterCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  };

  const counts = getFilterCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 dark:border-sage-400"></div>
        <span className="ml-3 text-forest-600 dark:text-[#C5D4C5]">
          {locale === 'sv' ? 'Laddar beställningar...' : 'Loading orders...'}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-lg inline-block">
          {error}
        </div>
        <button
          onClick={fetchOrders}
          className="mt-4 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
        >
          {locale === 'sv' ? 'Försök igen' : 'Try again'}
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ClipboardDocumentListIcon className="w-16 h-16 text-[#8A9A8A] dark:text-[#6B7B6B] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-forest-900 dark:text-[#E8EDE8] mb-2">
          {locale === 'sv' ? 'Inga beställningar än' : 'No orders yet'}
        </h3>
        <p className="text-forest-600 dark:text-[#C5D4C5] mb-6">
          {locale === 'sv'
            ? 'När du gör din första beställning kommer den att visas här.'
            : 'When you make your first order, it will appear here.'}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-6 py-3 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors"
        >
          {locale === 'sv' ? 'Börja handla' : 'Start shopping'}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="border-b border-cream-200 dark:border-[#3f4946]">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: locale === 'sv' ? 'Alla' : 'All', count: counts.all },
            { key: 'pending', label: locale === 'sv' ? 'Väntar' : 'Pending', count: counts.pending },
            { key: 'confirmed', label: locale === 'sv' ? 'Bekräftade' : 'Confirmed', count: counts.confirmed },
            { key: 'shipped', label: locale === 'sv' ? 'Skickade' : 'Shipped', count: counts.shipped },
            { key: 'delivered', label: locale === 'sv' ? 'Levererade' : 'Delivered', count: counts.delivered },
            { key: 'cancelled', label: locale === 'sv' ? 'Avbrutna' : 'Cancelled', count: counts.cancelled },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`${
                filter === tab.key
                  ? 'border-sage-600 dark:border-sage-400 text-sage-700 dark:text-sage-400'
                  : 'border-transparent text-forest-500 dark:text-[#8A9A8A] hover:text-forest-700 dark:hover:text-[#C5D4C5] hover:border-cream-400'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`${
                  filter === tab.key
                    ? 'bg-sage-600/10 dark:bg-sage-400/20 text-sage-700 dark:text-sage-400'
                    : 'bg-cream-100 dark:bg-[#2a3330] text-forest-600 dark:text-[#C5D4C5]'
                } ml-2 py-0.5 px-2 rounded-full text-xs`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-forest-600 dark:text-[#C5D4C5]">
            {locale === 'sv'
              ? `Inga beställningar med status "${filter === 'all' ? 'alla' : filter}".`
              : `No orders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              locale={locale}
              onCancel={handleCancelOrder}
            />
          ))}
        </div>
      )}

      {/* Load More (if needed for pagination) */}
      {filteredOrders.length >= 20 && (
        <div className="text-center pt-6">
          <button className="px-6 py-2 border border-cream-300 dark:border-[#4a5552] text-forest-600 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors">
            {locale === 'sv' ? 'Ladda fler beställningar' : 'Load more orders'}
          </button>
        </div>
      )}
    </div>
  );
}