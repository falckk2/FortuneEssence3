'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from '@/components/i18n/Link';
import {
  ShoppingBagIcon,
  BanknotesIcon,
  UserGroupIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
  customers: number;
  lowStockProducts: number;
  ordersTrend: number;
  revenueTrend: number;
}

interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: string;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);

const statusLabels: Record<string, string> = {
  pending: 'Väntande',
  confirmed: 'Bekräftad',
  shipped: 'Skickad',
  delivered: 'Levererad',
  cancelled: 'Avbruten',
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    shipped: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#343c39] dark:text-[#C5D4C5] dark:border-[#4a5552]';
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        fetch('/api/orders?action=statistics'),
        fetch('/api/orders?action=recent&limit=5'),
      ]);
      const [statsData, ordersData] = await Promise.all([
        statsResponse.json(),
        ordersResponse.json(),
      ]);

      if (statsData.success && ordersData.success) {
        const orderStats = statsData.data;
        const totalOrders = Object.values(orderStats).reduce(
          (sum: number, count) => sum + (count as number),
          0
        );
        setStats({
          totalOrders: totalOrders as number,
          pendingOrders: (orderStats.pending || 0) as number,
          revenue: 0,
          customers: 0,
          lowStockProducts: 0,
          ordersTrend: 12,
          revenueTrend: 8,
        });
        setRecentOrders(ordersData.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const statCards = useMemo(() => [
    {
      name: 'Totala beställningar',
      value: stats?.totalOrders || 0,
      change: stats?.ordersTrend || 0,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      link: '/admin/orders',
    },
    {
      name: 'Väntande beställningar',
      value: stats?.pendingOrders || 0,
      change: 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      link: '/admin/orders?status=pending',
    },
    {
      name: 'Intäkter',
      value: formatPrice(stats?.revenue || 0),
      change: stats?.revenueTrend || 0,
      icon: BanknotesIcon,
      color: 'bg-green-500',
      link: '/admin/analytics',
    },
    {
      name: 'Lågt lager',
      value: stats?.lowStockProducts || 0,
      change: 0,
      icon: CubeIcon,
      color: 'bg-red-500',
      link: '/admin/products?filter=low-stock',
    },
  ], [stats]);

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
        <ExclamationCircleIcon className="h-12 w-12 text-red-500" />
        <p className="text-forest-600 dark:text-[#C5D4C5]">Kunde inte ladda dashboarddata</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
        >
          Försök igen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Översikt</h1>
        <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Välkommen till adminpanelen</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.name}
              href={card.link}
              className="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 border border-transparent dark:border-[#3f4946]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {card.change !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    card.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {card.change > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    {Math.abs(card.change)}%
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">{card.name}</p>
                <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{card.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden border border-transparent dark:border-[#3f4946]">
        <div className="px-6 py-4 border-b border-cream-200 dark:border-[#3f4946] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8]">Senaste beställningar</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-sage-700 dark:text-sage-400 hover:text-sage-800 dark:hover:text-sage-300 font-medium hover:underline"
          >
            Visa alla →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 dark:bg-[#2a3330] border-b border-cream-200 dark:border-[#3f4946]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Order-ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Kund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Totalt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Datum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#242a28] divide-y divide-cream-200 dark:divide-[#3f4946]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sage-700 dark:text-sage-400 hover:text-sage-800 dark:hover:text-sage-300 font-medium hover:underline"
                      >
                        #{order.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-forest-700 dark:text-[#C5D4C5]">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-forest-600 dark:text-[#8A9A8A]">
                      {new Date(order.date).toLocaleDateString('sv-SE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-forest-600 dark:text-[#8A9A8A]">
            <ShoppingBagIcon className="h-12 w-12 mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
            <p>Inga beställningar ännu</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/products"
          className="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 text-center border border-transparent dark:border-[#3f4946]"
        >
          <CubeIcon className="h-8 w-8 mx-auto mb-3 text-sage-600" />
          <h3 className="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-1">Hantera produkter</h3>
          <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">Lägg till, redigera eller ta bort produkter</p>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 text-center border border-transparent dark:border-[#3f4946]"
        >
          <ShoppingBagIcon className="h-8 w-8 mx-auto mb-3 text-sage-600" />
          <h3 className="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-1">Hantera beställningar</h3>
          <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">Visa och behandla beställningar</p>
        </Link>

        <Link
          href="/admin/customers"
          className="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 text-center border border-transparent dark:border-[#3f4946]"
        >
          <UserGroupIcon className="h-8 w-8 mx-auto mb-3 text-sage-600" />
          <h3 className="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-1">Visa kunder</h3>
          <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">Hantera kundkonton</p>
        </Link>
      </div>
    </div>
  );
}
