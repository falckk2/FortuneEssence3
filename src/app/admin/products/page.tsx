'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.translations.sv.name.toLowerCase().includes(query) ||
        product.translations.en.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'in-stock') {
      filtered = filtered.filter(product => product.stock > 5);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter(product => product.stock > 0 && product.stock <= 5);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter(product => product.stock === 0);
    }

    setFilteredProducts(filtered);
  };

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      // In production, this would call the API to toggle product active status
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setProducts(products.map(p =>
          p.id === productId ? { ...p, isActive: !currentStatus } : p
        ));
        toast.success(
          !currentStatus ? 'Product activated' : 'Product deactivated'
        );
      } else {
        toast.error('Failed to update product');
      }
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'essential-oils': 'bg-sage-100 text-sage-700 border-sage-200',
      'carrier-oils': 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
      'diffusers': 'bg-cream-300 text-forest-700 border-cream-400',
      'accessories': 'bg-forest-100 text-forest-700 border-forest-200',
      'gift-sets': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[category] || 'bg-cream-200 text-forest-700 border-cream-300';
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
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
      return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    } else if (stock <= 5) {
      return { label: `Low Stock (${stock})`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    }
    return { label: `In Stock (${stock})`, color: 'bg-green-100 text-green-800 border-green-200' };
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-800">Products</h1>
          <p className="text-forest-600 mt-1">Manage your product catalog</p>
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
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors"
            >
              <option value="all">All Stock Levels</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-forest-600">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        {filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-cream-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product.id} className="hover:bg-cream-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-100 flex-shrink-0">
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
                                <PhotoIcon className="h-8 w-8 text-forest-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/products/${product.id}`}
                              className="font-medium text-forest-800 hover:text-sage-700 transition-colors"
                            >
                              {product.translations.sv.name}
                            </Link>
                            <p className="text-sm text-forest-600">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(product.category)}`}>
                          {getCategoryName(product.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-forest-800">
                        {product.price} kr
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
                              ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
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
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.translations.sv.name)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
          <div className="p-12 text-center text-forest-600">
            <PhotoIcon className="h-12 w-12 mx-auto mb-4 text-forest-400" />
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
    </div>
  );
}
