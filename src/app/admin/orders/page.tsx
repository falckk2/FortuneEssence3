'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from '@/components/i18n/Link';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Order {
  id: string;
  customerName?: string;
  total: number;
  status: string;
  paymentMethod: string;
  trackingNumber?: string;
  createdAt: string;
}

const ORDERS_FETCH_DAYS = 3650;
const ORDERS_FETCH_LIMIT = 10000;

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);

const formatPaymentMethod = (method: string) =>
  method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    processing: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
    delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-4 w-4" />;
    case 'confirmed':
    case 'processing':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'shipped':
      return <TruckIcon className="h-4 w-4" />;
    case 'delivered':
      return <ArchiveBoxIcon className="h-4 w-4" />;
    case 'cancelled':
      return <XCircleIcon className="h-4 w-4" />;
    default:
      return null;
  }
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmUpdate, setConfirmUpdate] = useState<{ orderId: string; newStatus: string } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/orders?action=recent&days=${ORDERS_FETCH_DAYS}&limit=${ORDERS_FETCH_LIMIT}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError('Failed to load orders');
        toast.error('Failed to load orders');
      }
    } catch {
      setError('Failed to load orders');
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Compute statistics client-side from the fetched orders
  const statistics = useMemo(() => {
    return statusOptions.reduce<Record<string, number>>((acc, { value }) => {
      acc[value] = orders.filter(o => o.status === value).length;
      return acc;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.trackingNumber?.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    return filtered;
  }, [orders, searchQuery, statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setConfirmUpdate(null);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success('Order status updated');
      } else {
        toast.error('Failed to update order status');
      }
    } catch {
      toast.error('Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Orders</h1>
        <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Manage and track customer orders</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div
          className={`bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft cursor-pointer hover:shadow-lg transition-all ${statusFilter === 'all' ? 'ring-2 ring-sage-600' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">All</span>
          </div>
          <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{orders.length}</p>
        </div>

        {statusOptions.map((status) => (
          <div
            key={status.value}
            className={`bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft cursor-pointer hover:shadow-lg transition-all ${statusFilter === status.value ? 'ring-2 ring-sage-600' : ''}`}
            onClick={() => setStatusFilter(status.value)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">{status.label}</span>
              <span className="text-forest-400 dark:text-[#6B7B6B]">{getStatusIcon(status.value)}</span>
            </div>
            <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">
              {statistics[status.value] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400 dark:text-[#6B7B6B]" />
            <input
              type="text"
              placeholder="Search by order ID, customer, or tracking number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] focus:border-sage-600 focus:outline-none transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 text-sm text-forest-600 dark:text-[#8A9A8A]">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#242a28] divide-y divide-cream-200 dark:divide-[#3f4946]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sage-700 hover:text-sage-800 font-medium hover:underline"
                      >
                        #{order.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-forest-700 dark:text-[#C5D4C5]">
                      {order.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-cream-200 dark:bg-[#343c39] text-forest-700 dark:text-[#C5D4C5]">
                        {formatPaymentMethod(order.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => setConfirmUpdate({ orderId: order.id, newStatus: e.target.value })}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-forest-600 dark:text-[#8A9A8A]">
                      {new Date(order.createdAt).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-forest-600 dark:text-[#C5D4C5]">
            <TruckIcon className="h-12 w-12 mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Status Change Confirmation Modal */}
      {confirmUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Update order status?</h3>
            <p className="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">
              Change order <span className="font-medium">#{confirmUpdate.orderId.substring(0, 8)}</span> to{' '}
              <span className="font-medium capitalize">{confirmUpdate.newStatus}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleUpdateStatus(confirmUpdate.orderId, confirmUpdate.newStatus)}
                className="flex-1 px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmUpdate(null)}
                className="flex-1 px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
