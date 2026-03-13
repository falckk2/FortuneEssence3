'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { BundleConfiguration, Product, ProductCategory } from '@/types';

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'essential-oils', label: 'Essential Oils' },
  { value: 'carrier-oils', label: 'Carrier Oils' },
  { value: 'diffusers', label: 'Diffusers' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'gift-sets', label: 'Gift Sets' },
  { value: 'bundles', label: 'Bundles' },
];

interface BundleForm {
  bundleProductId: string;
  requiredQuantity: string;
  allowedCategory: ProductCategory;
  discountPercentage: string;
}

const emptyForm: BundleForm = {
  bundleProductId: '',
  requiredQuantity: '3',
  allowedCategory: 'essential-oils',
  discountPercentage: '10',
};

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<BundleConfiguration[]>([]);
  const [bundleProducts, setBundleProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BundleForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [bundlesRes, productsRes] = await Promise.all([
        fetch('/api/bundles'),
        fetch('/api/products?category=bundles'),
      ]);
      const [bundlesData, productsData] = await Promise.all([
        bundlesRes.json(),
        productsRes.json(),
      ]);
      if (bundlesData.success) setBundles(bundlesData.data || []);
      if (productsData.success) setBundleProducts(productsData.data || []);
    } catch {
      setError(true);
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (bundle: BundleConfiguration) => {
    setEditingId(bundle.id);
    setForm({
      bundleProductId: bundle.bundleProductId,
      requiredQuantity: String(bundle.requiredQuantity),
      allowedCategory: bundle.allowedCategory,
      discountPercentage: String(bundle.discountPercentage),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.bundleProductId) {
      toast.error('Select a bundle product');
      return;
    }

    const qty = parseInt(form.requiredQuantity);
    const discount = parseFloat(form.discountPercentage);

    if (!form.requiredQuantity || isNaN(qty) || qty < 1) {
      toast.error('Required quantity must be at least 1');
      return;
    }
    if (!form.discountPercentage || isNaN(discount) || discount < 0 || discount > 100) {
      toast.error('Discount must be between 0 and 100');
      return;
    }

    setSaving(true);
    const body = {
      bundleProductId: form.bundleProductId,
      requiredQuantity: qty,
      allowedCategory: form.allowedCategory,
      discountPercentage: discount,
    };

    try {
      const url = editingId ? `/api/bundles/${editingId}` : '/api/bundles';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(editingId ? 'Bundle updated' : 'Bundle created');
        setModalOpen(false);
        fetchAll();
      } else {
        toast.error(data.error || 'Failed to save bundle');
      }
    } catch {
      toast.error('Failed to save bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/bundles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Bundle deleted');
        fetchAll();
      } else {
        toast.error(data.error || 'Failed to delete bundle');
      }
    } catch {
      toast.error('Failed to delete bundle');
    }
  };

  const getBundleProductName = (productId: string) => {
    const prod = bundleProducts.find(p => p.id === productId);
    return prod ? prod.translations.sv.name : productId;
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
        <p className="text-forest-600 dark:text-[#C5D4C5]">Failed to load bundles</p>
        <button
          onClick={fetchAll}
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
          <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Bundles</h1>
          <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Configure bundle discount rules</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
        >
          <PlusIcon className="h-5 w-5" />
          Add Bundle
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
        {bundles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Bundle Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Required Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Allowed Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 dark:divide-[#3f4946]">
                {bundles.map(bundle => (
                  <tr key={bundle.id} className="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
                    <td className="px-6 py-4 font-medium text-forest-800 dark:text-[#E8EDE8]">
                      {getBundleProductName(bundle.bundleProductId)}
                    </td>
                    <td className="px-6 py-4 text-forest-600 dark:text-[#C5D4C5]">{bundle.requiredQuantity}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-sage-100 dark:bg-[#2a3330] text-sage-700 dark:text-sage-400 border border-sage-200 dark:border-[#3f4946]">
                        {CATEGORIES.find(c => c.value === bundle.allowedCategory)?.label || bundle.allowedCategory}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-forest-800 dark:text-[#E8EDE8]">{bundle.discountPercentage}%</td>
                    <td className="px-6 py-4 text-sm text-forest-500 dark:text-[#8A9A8A]">
                      {new Date(bundle.createdAt).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(bundle)}
                          className="p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 dark:text-sage-400 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(bundle.id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
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
            <SwatchIcon className="h-12 w-12 mx-auto mb-4 text-forest-300 dark:text-[#6B7B6B]" />
            <p className="mb-4">No bundle configurations yet</p>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all"
            >
              <PlusIcon className="h-5 w-5" />
              Create First Bundle
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">
              {editingId ? 'Edit Bundle' : 'New Bundle Configuration'}
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="bundle-product" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Bundle Product *</label>
                {bundleProducts.length > 0 ? (
                  <select
                    id="bundle-product"
                    value={form.bundleProductId}
                    onChange={e => setForm(f => ({ ...f, bundleProductId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                  >
                    <option value="">Select a bundle product...</option>
                    {bundleProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.translations.sv.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-forest-500 dark:text-[#8A9A8A] italic px-4 py-3 rounded-xl border-2 border-cream-200 dark:border-[#3f4946] bg-cream-50 dark:bg-[#1a1f1e]">
                    No products with category &ldquo;bundles&rdquo; found. Create one first.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bundle-qty" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Required Qty *</label>
                  <input
                    id="bundle-qty"
                    type="number"
                    min="1"
                    value={form.requiredQuantity}
                    onChange={e => setForm(f => ({ ...f, requiredQuantity: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="bundle-discount" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Discount % *</label>
                  <input
                    id="bundle-discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.discountPercentage}
                    onChange={e => setForm(f => ({ ...f, discountPercentage: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bundle-category" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Allowed Category *</label>
                <select
                  id="bundle-category"
                  value={form.allowedCategory}
                  onChange={e => setForm(f => ({ ...f, allowedCategory: e.target.value as ProductCategory }))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 rounded-full border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 rounded-full bg-sage-600 text-white font-medium hover:bg-sage-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Delete bundle?</h3>
            <p className="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">
              Delete <span className="font-medium">{getBundleProductName(confirmDelete)}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
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
