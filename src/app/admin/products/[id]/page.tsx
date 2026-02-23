'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Product } from '@/types';

const CATEGORIES = [
  { value: 'essential-oils', label: 'Essential Oils' },
  { value: 'carrier-oils', label: 'Carrier Oils' },
  { value: 'diffusers', label: 'Diffusers' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'gift-sets', label: 'Gift Sets' },
  { value: 'bundles', label: 'Bundles' },
];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    nameSv: '',
    descriptionSv: '',
    nameEn: '',
    descriptionEn: '',
    price: '',
    sku: '',
    category: 'essential-oils',
    weight: '',
    length: '',
    width: '',
    height: '',
    stock: '0',
    images: '',
    isActive: true,
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        const p: Product = data.data;
        setForm({
          nameSv: p.translations.sv.name,
          descriptionSv: p.translations.sv.description,
          nameEn: p.translations.en.name,
          descriptionEn: p.translations.en.description,
          price: String(p.price),
          sku: p.sku,
          category: p.category,
          weight: String(p.weight),
          length: String(p.dimensions.length),
          width: String(p.dimensions.width),
          height: String(p.dimensions.height),
          stock: String(p.stock),
          images: (p.images || []).join('\n'),
          isActive: p.isActive,
        });
      } else {
        toast.error('Product not found');
        router.push('/admin/products');
      }
    } catch {
      toast.error('Failed to load product');
      router.push('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const imageList = form.images
      .split('\n')
      .map(url => url.trim())
      .filter(Boolean);

    const body = {
      name: form.nameEn || form.nameSv,
      description: form.descriptionEn || form.descriptionSv,
      price: parseFloat(form.price),
      category: form.category,
      images: imageList,
      stock: parseInt(form.stock),
      sku: form.sku,
      weight: parseFloat(form.weight) || 0,
      dimensions: {
        length: parseFloat(form.length) || 0,
        width: parseFloat(form.width) || 0,
        height: parseFloat(form.height) || 0,
      },
      isActive: form.isActive,
      translations: {
        sv: { name: form.nameSv, description: form.descriptionSv },
        en: { name: form.nameEn, description: form.descriptionEn },
      },
    };

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Product updated successfully');
      } else {
        toast.error(data.error || 'Failed to update product');
      }
    } catch {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? It will be hidden from the store.')) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Product deleted');
        router.push('/admin/products');
      } else {
        toast.error(data.error || 'Failed to delete product');
      }
    } catch {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg hover:bg-cream-100 transition-colors text-forest-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-forest-800">Edit Product</h1>
            <p className="text-forest-600 mt-1">Update product details</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 transition-all disabled:opacity-50"
        >
          <TrashIcon className="h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Swedish */}
        <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800">Swedish (Svenska)</h2>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Name (SV) *</label>
            <input
              name="nameSv"
              value={form.nameSv}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Description (SV) *</label>
            <textarea
              name="descriptionSv"
              value={form.descriptionSv}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* English */}
        <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800">English</h2>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Name (EN) *</label>
            <input
              name="nameEn"
              value={form.nameEn}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Description (EN) *</label>
            <textarea
              name="descriptionEn"
              value={form.descriptionEn}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Pricing & Catalog */}
        <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800">Pricing & Catalog</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Price (kr) *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">SKU *</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Physical */}
        <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800">Physical Details</h2>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">Weight (g)</label>
            <input
              name="weight"
              type="number"
              min="0"
              value={form.weight}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Length (cm)</label>
              <input
                name="length"
                type="number"
                min="0"
                step="0.1"
                value={form.length}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Width (cm)</label>
              <input
                name="width"
                type="number"
                min="0"
                step="0.1"
                value={form.width}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-1">Height (cm)</label>
              <input
                name="height"
                type="number"
                min="0"
                step="0.1"
                value={form.height}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Images & Status */}
        <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800">Images & Status</h2>
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-1">
              Image URLs (one per line)
            </label>
            <textarea
              name="images"
              value={form.images}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none resize-none font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              className="w-5 h-5 rounded border-cream-300 text-sage-600 focus:ring-sage-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-forest-700">
              Active (visible in store)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 rounded-full border-2 border-cream-300 text-forest-700 font-semibold hover:bg-cream-100 transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
