'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BanknotesIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    change: number;
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    change: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    change: number;
  };
  products: {
    totalSold: number;
    topSelling: Array<{ id: string; name: string; quantity: number; revenue: number }>;
  };
  revenueByCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  recentSales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'essential-oils': 'bg-sage-500',
    'carrier-oils': 'bg-terracotta-500',
    'diffusers': 'bg-cream-600',
    'accessories': 'bg-forest-500',
    'gift-sets': 'bg-rose-500',
  };
  return colors[category] || 'bg-gray-500';
};

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'essential-oils': 'Eteriska oljor',
    'carrier-oils': 'Bäraroljor',
    'diffusers': 'Diffusers',
    'accessories': 'Tillbehör',
    'gift-sets': 'Presentset',
  };
  return names[category] || category;
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-forest-600 dark:text-[#C5D4C5]">Failed to load analytics data</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const maxRevenue = Math.max(...analytics.recentSales.map(s => s.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Analytics</h1>
          <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Track your business performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-white dark:bg-[#242a28] rounded-xl p-1 shadow-soft">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                timeRange === range
                  ? 'bg-sage-600 text-white'
                  : 'text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-50 dark:hover:bg-[#2a3330]'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analytics.revenue.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {analytics.revenue.change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4" />
              )}
              {Math.abs(analytics.revenue.change)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8] mb-2">
              {formatPrice(analytics.revenue.total)}
            </p>
            <div className="text-xs text-forest-600 dark:text-[#8A9A8A] space-y-1">
              <p>Today: {formatPrice(analytics.revenue.today)}</p>
              <p>This week: {formatPrice(analytics.revenue.thisWeek)}</p>
              <p>This month: {formatPrice(analytics.revenue.thisMonth)}</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <ShoppingBagIcon className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analytics.orders.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {analytics.orders.change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4" />
              )}
              {Math.abs(analytics.orders.change)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8] mb-2">
              {analytics.orders.total}
            </p>
            <div className="text-xs text-forest-600 dark:text-[#8A9A8A] space-y-1">
              <p>Today: {analytics.orders.today}</p>
              <p>This week: {analytics.orders.thisWeek}</p>
              <p>This month: {analytics.orders.thisMonth}</p>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analytics.customers.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {analytics.customers.change >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4" />
              )}
              {Math.abs(analytics.customers.change)}%
            </div>
          </div>
          <div>
            <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8] mb-2">
              {analytics.customers.total}
            </p>
            <div className="text-xs text-forest-600 dark:text-[#8A9A8A] space-y-1">
              <p>New: {analytics.customers.new}</p>
              <p>Returning: {analytics.customers.returning}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-6 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-sage-600" />
            Revenue by Category
          </h2>
          {analytics.revenueByCategory.length === 0 ? (
            <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">No category data available.</p>
          ) : (
            <div className="space-y-4">
              {analytics.revenueByCategory.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-forest-700 dark:text-[#C5D4C5]">
                      {getCategoryName(category.category)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                        {category.percentage.toFixed(1)}%
                      </span>
                      <span className="text-sm font-bold text-forest-800 dark:text-[#E8EDE8]">
                        {formatPrice(category.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="h-3 bg-cream-200 dark:bg-[#343c39] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getCategoryColor(category.category)} transition-all`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-6 w-6 text-sage-600" />
              Top Selling Products
            </h2>
            <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">
              {analytics.products.totalSold} units total
            </span>
          </div>
          {analytics.products.topSelling.length === 0 ? (
            <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">No products sold yet.</p>
          ) : (
            <div className="space-y-4">
              {analytics.products.topSelling.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-sage-100 dark:bg-[#2a3330] flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-sage-700 dark:text-sage-400">#{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-forest-800 dark:text-[#E8EDE8] truncate">{product.name}</p>
                    <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                      {product.quantity} units sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-forest-800 dark:text-[#E8EDE8]">
                      {formatPrice(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Chart */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
        <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-6 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-sage-600" />
          Sales Overview
        </h2>

        {analytics.recentSales.length === 0 ? (
          <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">No sales data available.</p>
        ) : (
          <div className="space-y-3">
            {analytics.recentSales.map((sale) => {
              const barWidth = (sale.revenue / maxRevenue) * 100;
              return (
                  <div key={sale.date} className="flex items-center gap-4">
                    <span className="text-sm text-forest-600 dark:text-[#8A9A8A] w-24 flex-shrink-0">
                      {new Date(sale.date).toLocaleDateString('sv-SE', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <div className="flex-1 h-8 bg-cream-200 dark:bg-[#343c39] rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sage-500 to-sage-600 transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-forest-800 dark:text-[#E8EDE8] w-28 text-right flex-shrink-0">
                      {formatPrice(sale.revenue)}
                    </span>
                    <span className="text-sm text-forest-600 dark:text-[#8A9A8A] w-16 text-right flex-shrink-0">
                      {sale.orders} orders
                    </span>
                  </div>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
