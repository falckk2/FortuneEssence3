'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch order statistics
        const statsResponse = await fetch('/api/orders?action=statistics');
        const statsData = await statsResponse.json();

        // Fetch recent orders
        const ordersResponse = await fetch('/api/orders?action=recent&limit=5');
        const ordersData = await ordersResponse.json();

        if (statsData.success && ordersData.success) {
          // Transform the data for display
          const orderStats = statsData.data;
          const totalOrders = Object.values(orderStats).reduce((sum: number, count) => sum + (count as number), 0);

          setStats({
            totalOrders: totalOrders as number,
            pendingOrders: (orderStats.pending || 0) as number,
            revenue: 0, // Would come from aggregated order totals
            customers: 0, // Would come from customer count API
            lowStockProducts: 0, // Would come from inventory API
            ordersTrend: 12, // Mock trend data
            revenueTrend: 8, // Mock trend data
          });

          setRecentOrders(ordersData.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Orders',
      value: stats?.totalOrders || 0,
      change: stats?.ordersTrend || 0,
      icon: ShoppingBagIcon,
      color: 'bg-blue-500',
      link: '/admin/orders'
    },
    {
      name: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      change: 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      link: '/admin/orders?status=pending'
    },
    {
      name: 'Revenue',
      value: `${stats?.revenue || 0} kr`,
      change: stats?.revenueTrend || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      link: '/admin/analytics'
    },
    {
      name: 'Low Stock Items',
      value: stats?.lowStockProducts || 0,
      change: 0,
      icon: CubeIcon,
      color: 'bg-red-500',
      link: '/admin/products?filter=low-stock'
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'confirmed': 'bg-blue-100 text-blue-800 border-blue-200',
      'shipped': 'bg-purple-100 text-purple-800 border-purple-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-forest-800">Dashboard</h1>
        <p className="text-forest-600 mt-1">Welcome to your admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.name}
              href={card.link}
              className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {card.change !== 0 && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    card.change > 0 ? 'text-green-600' : 'text-red-600'
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
                <p className="text-sm text-forest-600 mb-1">{card.name}</p>
                <p className="text-2xl font-bold text-forest-800">{card.value}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-forest-800">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-sage-700 hover:text-sage-800 font-medium hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-cream-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sage-700 hover:text-sage-800 font-medium hover:underline"
                      >
                        #{order.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-forest-700">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800">
                      {order.total} kr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-forest-600">
                      {new Date(order.date).toLocaleDateString('sv-SE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-forest-600">
            <ShoppingBagIcon className="h-12 w-12 mx-auto mb-4 text-forest-400" />
            <p>No orders yet</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/products"
          className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 text-center"
        >
          <CubeIcon className="h-8 w-8 mx-auto mb-3 text-sage-600" />
          <h3 className="font-semibold text-forest-800 mb-1">Manage Products</h3>
          <p className="text-sm text-forest-600">Add, edit, or remove products</p>
        </Link>

        <Link
          href="/admin/orders"
          className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 text-center"
        >
          <ShoppingBagIcon className="h-8 w-8 mx-auto mb-3 text-sage-600" />
          <h3 className="font-semibold text-forest-800 mb-1">Process Orders</h3>
          <p className="text-sm text-forest-600">View and manage orders</p>
        </Link>

        <Link
          href="/admin/customers"
          className="bg-white rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 text-center"
        >
          <UserGroupIcon className="h-8 w-8 mx-auto mb-3 text-sage-600" />
          <h3 className="font-semibold text-forest-800 mb-1">View Customers</h3>
          <p className="text-sm text-forest-600">Manage customer accounts</p>
        </Link>
      </div>
    </div>
  );
}
