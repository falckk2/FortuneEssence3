'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ShoppingBagIcon,
  EyeIcon,
  TrashIcon
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'recent'>('recent');
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    newsletter: 0,
    avgOrderValue: 0,
  });

  const calculateStatistics = useCallback((customerData: Customer[]) => {
    const total = customerData.length;
    const active = customerData.filter(c => c.status === 'active').length;
    const inactive = customerData.filter(c => c.status === 'inactive').length;
    const newsletter = customerData.filter(c => c.newsletter).length;
    const totalSpent = customerData.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalOrders = customerData.reduce((sum, c) => sum + c.totalOrders, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    setStatistics({
      total,
      active,
      inactive,
      newsletter,
      avgOrderValue,
    });
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data || []);
        calculateStatistics(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [calculateStatistics]);

  const filterAndSortCustomers = useCallback(() => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    // Sort
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

    setFilteredCustomers(filtered);
  }, [customers, searchQuery, statusFilter, sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    filterAndSortCustomers();
  }, [filterAndSortCustomers]);

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone and will also delete all associated data.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== customerId));
        toast.success('Customer deleted successfully');
      } else {
        toast.error('Failed to delete customer');
      }
    } catch {
      toast.error('Failed to delete customer');
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
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
        <h1 className="text-3xl font-serif font-bold text-forest-800">Customers</h1>
        <p className="text-forest-600 mt-1">Manage your customer database</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Total Customers</span>
            <UserIcon className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800">{statistics.total}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Active</span>
            <UserIcon className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800">{statistics.active}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Inactive</span>
            <UserIcon className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-forest-800">{statistics.inactive}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Newsletter</span>
            <EnvelopeIcon className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800">{statistics.newsletter}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-forest-600">Avg Order Value</span>
            <ShoppingBagIcon className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-forest-800">{statistics.avgOrderValue.toFixed(0)} kr</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
              <option value="orders">Most Orders</option>
              <option value="spent">Highest Spent</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-forest-600">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-cream-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-cream-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-sage-700" />
                        </div>
                        <div>
                          <div className="font-medium text-forest-800">{customer.name}</div>
                          {customer.newsletter && (
                            <span className="inline-flex items-center gap-1 text-xs text-purple-600">
                              <EnvelopeIcon className="h-3 w-3" />
                              Newsletter
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2 text-forest-700">
                          <EnvelopeIcon className="h-4 w-4 text-forest-400" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-forest-600 mt-1">
                            <PhoneIcon className="h-4 w-4 text-forest-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShoppingBagIcon className="h-4 w-4 text-forest-400" />
                        <span className="font-medium text-forest-800">{customer.totalOrders}</span>
                      </div>
                      {customer.lastOrderDate && (
                        <div className="text-xs text-forest-600 mt-1">
                          Last: {new Date(customer.lastOrderDate).toLocaleDateString('sv-SE')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800">
                      {customer.totalSpent.toFixed(2)} kr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-forest-600">
                        <CalendarIcon className="h-4 w-4 text-forest-400" />
                        {new Date(customer.createdAt).toLocaleDateString('sv-SE')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
          <div className="p-12 text-center text-forest-600">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-forest-400" />
            <p>No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
