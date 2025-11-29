'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
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
    topSelling: Array<{
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }>;
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

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-forest-600">Failed to load analytics data</p>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'essential-oils': 'bg-sage-500',
      'carrier-oils': 'bg-terracotta-500',
      'diffusers': 'bg-cream-600',
      'accessories': 'bg-forest-500',
      'gift-sets': 'bg-rose-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      'essential-oils': 'Eteriska oljor',
      'carrier-oils': 'Bäraroljor',
      'diffusers': 'Diffusers',
      'accessories': 'Tillbehör',
      'gift-sets': 'Presentset',
    };
    return names[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-800">Analytics</h1>
          <p className="text-forest-600 mt-1">Track your business performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-soft">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeRange === 'week'
                ? 'bg-sage-600 text-white'
                : 'text-forest-700 hover:bg-cream-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeRange === 'month'
                ? 'bg-sage-600 text-white'
                : 'text-forest-700 hover:bg-cream-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              timeRange === 'year'
                ? 'bg-sage-600 text-white'
                : 'text-forest-700 hover:bg-cream-50'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analytics.revenue.change >= 0 ? 'text-green-600' : 'text-red-600'
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
            <p className="text-sm text-forest-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-forest-800 mb-2">
              {analytics.revenue.total.toFixed(0)} kr
            </p>
            <div className="text-xs text-forest-600 space-y-1">
              <p>Today: {analytics.revenue.today.toFixed(0)} kr</p>
              <p>This week: {analytics.revenue.thisWeek.toFixed(0)} kr</p>
              <p>This month: {analytics.revenue.thisMonth.toFixed(0)} kr</p>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <ShoppingBagIcon className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analytics.orders.change >= 0 ? 'text-green-600' : 'text-red-600'
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
            <p className="text-sm text-forest-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-forest-800 mb-2">
              {analytics.orders.total}
            </p>
            <div className="text-xs text-forest-600 space-y-1">
              <p>Today: {analytics.orders.today}</p>
              <p>This week: {analytics.orders.thisWeek}</p>
              <p>This month: {analytics.orders.thisMonth}</p>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              analytics.customers.change >= 0 ? 'text-green-600' : 'text-red-600'
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
            <p className="text-sm text-forest-600 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-forest-800 mb-2">
              {analytics.customers.total}
            </p>
            <div className="text-xs text-forest-600 space-y-1">
              <p>New: {analytics.customers.new}</p>
              <p>Returning: {analytics.customers.returning}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold text-forest-800 mb-6 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-sage-600" />
            Revenue by Category
          </h2>
          <div className="space-y-4">
            {analytics.revenueByCategory.map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-forest-700">
                    {getCategoryName(category.category)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-forest-600">
                      {category.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm font-bold text-forest-800">
                      {category.revenue.toFixed(0)} kr
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-cream-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getCategoryColor(category.category)} transition-all`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="text-xl font-semibold text-forest-800 mb-6 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-6 w-6 text-sage-600" />
            Top Selling Products
          </h2>
          <div className="space-y-4">
            {analytics.products.topSelling.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-cream-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-sage-700">#{index + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-forest-800 truncate">{product.name}</p>
                  <p className="text-sm text-forest-600">
                    {product.quantity} units sold
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-forest-800">
                    {product.revenue.toFixed(0)} kr
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales Chart */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <h2 className="text-xl font-semibold text-forest-800 mb-6 flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-sage-600" />
          Sales Overview
        </h2>

        {/* Simple Bar Chart */}
        <div className="space-y-3">
          {analytics.recentSales.map((sale, index) => {
            const maxRevenue = Math.max(...analytics.recentSales.map(s => s.revenue));
            const barWidth = (sale.revenue / maxRevenue) * 100;

            return (
              <div key={index} className="flex items-center gap-4">
                <span className="text-sm text-forest-600 w-24 flex-shrink-0">
                  {new Date(sale.date).toLocaleDateString('sv-SE', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
                <div className="flex-1">
                  <div className="h-8 bg-cream-200 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sage-500 to-sage-600 transition-all flex items-center justify-end pr-3"
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="text-sm font-medium text-white">
                        {sale.revenue.toFixed(0)} kr
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-sm text-forest-600 w-16 text-right">
                  {sale.orders} orders
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
