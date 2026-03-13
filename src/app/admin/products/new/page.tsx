'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'essential-oils', label: 'Essential Oils' },
  { value: 'carrier-oils', label: 'Carrier Oils' },
  { value: 'diffusers', label: 'Diffusers' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'gift-sets', label: 'Gift Sets' },
  { value: 'bundles', label: 'Bundles' },
];

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

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
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Product created successfully');
        router.push('/admin/products');
      } else {
        toast.error(data.error || 'Failed to create product');
      }
    } catch {
      toast.error('Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors text-forest-600 dark:text-[#C5D4C5]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">New Product</h1>
          <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Swedish */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Swedish (Svenska)</h2>
          <div>
            <label htmlFor="nameSv" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Name (SV) *</label>
            <input
              id="nameSv"
              name="nameSv"
              value={form.nameSv}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
              placeholder="Produktnamn på svenska"
            />
          </div>
          <div>
            <label htmlFor="descriptionSv" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Description (SV) *</label>
            <textarea
              id="descriptionSv"
              name="descriptionSv"
              value={form.descriptionSv}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none resize-none"
              placeholder="Produktbeskrivning på svenska"
            />
          </div>
        </div>

        {/* English */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">English</h2>
          <div>
            <label htmlFor="nameEn" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Name (EN) *</label>
            <input
              id="nameEn"
              name="nameEn"
              value={form.nameEn}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
              placeholder="Product name in English"
            />
          </div>
          <div>
            <label htmlFor="descriptionEn" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Description (EN) *</label>
            <textarea
              id="descriptionEn"
              name="descriptionEn"
              value={form.descriptionEn}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none resize-none"
              placeholder="Product description in English"
            />
          </div>
        </div>

        {/* Pricing & Catalog */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Pricing & Catalog</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Price (kr) *</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                placeholder="89.00"
              />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">SKU *</label>
              <input
                id="sku"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                placeholder="LAV-001"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Category *</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Initial Stock</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Physical */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Physical Details</h2>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Weight (g)</label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="0"
              value={form.weight}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
              placeholder="30"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="length" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Length (cm)</label>
              <input
                id="length"
                name="length"
                type="number"
                min="0"
                step="0.1"
                value={form.length}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                placeholder="3"
              />
            </div>
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Width (cm)</label>
              <input
                id="width"
                name="width"
                type="number"
                min="0"
                step="0.1"
                value={form.width}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                placeholder="3"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Height (cm)</label>
              <input
                id="height"
                name="height"
                type="number"
                min="0"
                step="0.1"
                value={form.height}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                placeholder="8"
              />
            </div>
          </div>
        </div>

        {/* Images & Status */}
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Images & Status</h2>
          <div>
            <label htmlFor="images" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
              Image URLs (one per line)
            </label>
            <textarea
              id="images"
              name="images"
              value={form.images}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none resize-none font-mono text-sm"
              placeholder="/images/products/product.png"
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
            <label htmlFor="isActive" className="text-sm font-medium text-forest-700 dark:text-[#C5D4C5]">
              Active (visible in store)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 rounded-full border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-semibold hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
