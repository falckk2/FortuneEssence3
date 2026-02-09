'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ReturnListItem {
  id: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  status: string;
  reason: string;
  refundAmount: number;
  createdAt: string;
  items: Array<{ id: string; productName?: string; quantity: number }>;
}

const statusLabels: Record<string, string> = {
  pending: 'Väntande',
  approved: 'Godkänd',
  rejected: 'Avslagen',
  received: 'Mottagen',
  refunded: 'Återbetald',
  cancelled: 'Avbruten',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  received: 'bg-purple-100 text-purple-800 border-purple-200',
  refunded: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState<Record<string, number>>({});

  // Fetch stats once on mount via lightweight counts endpoint
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/returns?counts=true');
        const data = await response.json();
        if (data.success) {
          setStats(data.data || {});
        }
      } catch {
        // Stats are supplementary
      }
    };
    fetchStats();
  }, []);

  const fetchReturns = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/returns?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setReturns(data.data || []);
      } else {
        toast.error('Kunde inte ladda returer');
      }
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      toast.error('Kunde inte ladda returer');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReturns(searchQuery || undefined);
  }, [fetchReturns]);

  const handleSearch = () => {
    fetchReturns(searchQuery || undefined);
  };

  const statCards = [
    { key: 'pending', label: 'Väntande', icon: ClockIcon, color: 'text-yellow-600' },
    { key: 'approved', label: 'Godkända', icon: CheckCircleIcon, color: 'text-blue-600' },
    { key: 'received', label: 'Mottagna', icon: InboxIcon, color: 'text-purple-600' },
    { key: 'refunded', label: 'Återbetalade', icon: CurrencyDollarIcon, color: 'text-green-600' },
  ];

  if (loading && returns.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-forest-800">Returer</h1>
        <p className="text-forest-600 mt-1">Hantera returer och återbetalningar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="bg-white rounded-xl p-4 shadow-soft cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setStatusFilter(key === statusFilter ? 'all' : key)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-forest-600">{label}</span>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-forest-800">{stats[key] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
            <input
              type="text"
              placeholder="Sök på order-ID, kund..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
          >
            <option value="all">Alla statusar</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 text-sm text-forest-600">
          Visar {returns.length} returer
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {returns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Retur-ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Order-ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Kund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Artiklar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Belopp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Åtgärder
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-cream-200">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/returns/${ret.id}`}
                        className="text-sage-700 hover:text-sage-800 font-medium hover:underline"
                      >
                        #{ret.id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-forest-700">
                      <Link
                        href={`/admin/orders/${ret.orderId}`}
                        className="hover:underline"
                      >
                        #{ret.orderId.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-forest-700">
                      {ret.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-forest-700">
                      {ret.items?.length || 0} st
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800">
                      {ret.refundAmount?.toFixed(2)} kr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusColors[ret.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[ret.status] || ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-forest-600">
                      {new Date(ret.createdAt).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/returns/${ret.id}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sage-50 text-sage-700 transition-colors"
                      >
                        Visa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-forest-600">
            <ArrowPathIcon className="h-12 w-12 mx-auto mb-4 text-forest-400" />
            <p>Inga returer hittades</p>
          </div>
        )}
      </div>
    </div>
  );
}
