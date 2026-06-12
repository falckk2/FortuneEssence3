'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from '@/components/i18n/Link';
import Image from 'next/image';
import { Product } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'essential-oils': 'bg-sage-100 text-sage-700 border-sage-200 dark:bg-[#2a3330] dark:text-sage-400 dark:border-[#3f4946]',
    'carrier-oils': 'bg-terracotta-100 text-terracotta-700 border-terracotta-200 dark:bg-[#2a3330] dark:text-terracotta-400 dark:border-[#3f4946]',
    'diffusers': 'bg-cream-300 text-forest-700 border-cream-400 dark:bg-[#2a3330] dark:text-[#C5D4C5] dark:border-[#3f4946]',
    'accessories': 'bg-forest-100 text-forest-700 border-forest-200 dark:bg-[#2a3330] dark:text-[#C5D4C5] dark:border-[#3f4946]',
    'gift-sets': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  };
  return colors[category] || 'bg-cream-200 text-forest-700 border-cream-300 dark:bg-[#2a3330] dark:text-[#C5D4C5] dark:border-[#3f4946]';
};

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'essential-oils': 'Essential Oils',
    'carrier-oils': 'Carrier Oils',
    'diffusers': 'Diffusers',
    'accessories': 'Accessories',
    'gift-sets': 'Gift Sets',
  };
  return names[category] || category;
};

const getStockStatus = (stock: number) => {
  if (stock === 0) {
    return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' };
  } else if (stock <= 5) {
    return { label: `Low Stock (${stock})`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' };
  }
  return { label: `In Stock (${stock})`, color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' };
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        setError(true);
        toast.error('Failed to load products');
      }
    } catch {
      setError(true);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.translations.sv.name.toLowerCase().includes(query) ||
        product.translations.en.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(product => product.stock > 5);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(product => product.stock > 0 && product.stock <= 5);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(product => product.stock === 0);
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, isActive: !currentStatus } : p
        ));
        toast.success(!currentStatus ? 'Product activated' : 'Product deactivated');
      } else {
        toast.error('Failed to update product');
      }
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeleteConfirm(null);
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    } catch {
      toast.error('Failed to delete product');
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
        <p className="text-red-600 dark:text-red-400">Failed to load products</p>
        <button
          onClick={fetchProducts}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Products</h1>
          <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="h-5 w-5" />
          Add Product
        </Link>
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
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] focus:border-sage-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="essential-oils">Essential Oils</option>
              <option value="carrier-oils">Carrier Oils</option>
              <option value="diffusers">Diffusers</option>
              <option value="accessories">Accessories</option>
              <option value="gift-sets">Gift Sets</option>
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors"
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-forest-600 dark:text-[#8A9A8A]">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#242a28] divide-y divide-cream-200 dark:divide-[#3f4946]">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product.id} className="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-100 dark:bg-[#2a3330] flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.translations.sv.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PhotoIcon className="h-8 w-8 text-forest-300 dark:text-[#6B7B6B]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${product.id}`}
                              className="font-medium text-forest-800 dark:text-[#E8EDE8] hover:text-sage-700 dark:hover:text-sage-400 transition-colors"
                            >
                              {product.translations.sv.name}
                            </Link>
                            <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(product.category)}`}>
                          {getCategoryName(product.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(product.id, product.isActive)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                            product.isActive
                              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700 dark:hover:bg-green-900/50'
                              : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-[#343c39] dark:text-[#8A9A8A] dark:border-[#4a5552] dark:hover:bg-[#3f4946]'
                          }`}
                        >
                          {product.isActive ? (
                            <>
                              <EyeIcon className="h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeSlashIcon className="h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 dark:text-sage-400 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm({ id: product.id, name: product.translations.sv.name })}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-forest-600 dark:text-[#C5D4C5]">
            <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
            <p className="mb-4">No products found</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Add Your First Product
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Delete product?</h3>
            <p className="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteProduct(deleteConfirm.id)}
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
