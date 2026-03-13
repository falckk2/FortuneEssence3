'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShoppingBagIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive';
  newsletter: boolean;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);

const getStatusColor = (status: string) => {
  return status === 'active'
    ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
    : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#343c39] dark:text-[#8A9A8A] dark:border-[#4a5552]';
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'recent'>('recent');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data || []);
      } else {
        setError(true);
        toast.error('Failed to load customers');
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(true);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const statistics = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === 'active').length;
    const inactive = customers.filter(c => c.status === 'inactive').length;
    const newsletter = customers.filter(c => c.newsletter).length;
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    return { total, active, inactive, newsletter, avgOrderValue };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [customers, searchQuery, statusFilter, sortBy]);

  const handleDeleteCustomer = async (customerId: string) => {
    setDeleteConfirm(null);
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        toast.success('Customer deleted successfully');
      } else {
        toast.error('Failed to delete customer');
      }
    } catch {
      toast.error('Failed to delete customer');
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
        <p className="text-red-600 dark:text-red-400">Failed to load customers</p>
        <button
          onClick={fetchCustomers}
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
        <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Customers</h1>
        <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Manage your customer database</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Total Customers</span>
            <UserIcon className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{statistics.total}</p>
        </div>

        <div className="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Active</span>
            <UserIcon className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{statistics.active}</p>
        </div>

        <div className="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Inactive</span>
            <UserIcon className="h-5 w-5 text-forest-400 dark:text-[#6B7B6B]" />
          </div>
          <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{statistics.inactive}</p>
        </div>

        <div className="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Newsletter</span>
            <EnvelopeIcon className="h-5 w-5 text-sage-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{statistics.newsletter}</p>
        </div>

        <div className="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Avg Order Value</span>
            <ShoppingBagIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{formatPrice(statistics.avgOrderValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400 dark:text-[#6B7B6B]" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] focus:border-sage-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'orders' | 'spent' | 'recent')}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
              <option value="orders">Most Orders</option>
              <option value="spent">Highest Spent</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-forest-600 dark:text-[#8A9A8A]">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#242a28] divide-y divide-cream-200 dark:divide-[#3f4946]">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage-100 dark:bg-[#2a3330] flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-sage-700 dark:text-sage-400" />
                        </div>
                        <div>
                          <div className="font-medium text-forest-800 dark:text-[#E8EDE8]">{customer.name}</div>
                          {customer.newsletter && (
                            <span className="inline-flex items-center gap-1 text-xs text-sage-600 dark:text-sage-400">
                              <EnvelopeIcon className="h-3 w-3" />
                              Newsletter
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-forest-700 dark:text-[#C5D4C5]">
                          <EnvelopeIcon className="h-4 w-4 text-forest-400 dark:text-[#6B7B6B]" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-forest-600 dark:text-[#8A9A8A] mt-1">
                            <PhoneIcon className="h-4 w-4 text-forest-400 dark:text-[#6B7B6B]" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShoppingBagIcon className="h-4 w-4 text-forest-400 dark:text-[#6B7B6B]" />
                        <span className="font-medium text-forest-800 dark:text-[#E8EDE8]">{customer.totalOrders}</span>
                      </div>
                      {customer.lastOrderDate && (
                        <div className="text-xs text-forest-600 dark:text-[#8A9A8A] mt-1">
                          Last: {new Date(customer.lastOrderDate).toLocaleDateString('sv-SE')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-forest-600 dark:text-[#8A9A8A]">
                        <CalendarIcon className="h-4 w-4 text-forest-400 dark:text-[#6B7B6B]" />
                        {new Date(customer.createdAt).toLocaleDateString('sv-SE')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 dark:text-sage-400 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => setDeleteConfirm({ id: customer.id, name: customer.name })}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-forest-600 dark:text-[#C5D4C5]">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
            <p>No customers found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Delete customer?</h3>
            <p className="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium">{deleteConfirm.name}</span>?
              This action cannot be undone and will also delete all associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteCustomer(deleteConfirm.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
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
