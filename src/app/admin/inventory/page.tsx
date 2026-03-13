'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  LockClosedIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface InventoryItem {
  productId: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  product: {
    id: string;
    nameSv: string;
    nameEn: string;
    sku: string;
    isActive: boolean;
  } | null;
}

interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  reservedStock: number;
}

interface AdjustModal {
  productId: string;
  productName: string;
  currentQty: number;
}

const getRowStyle = (item: InventoryItem, lowStockIds: string[]) => {
  if (item.quantity === 0) return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-400';
  if (lowStockIds.includes(item.productId)) return 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-400';
  return '';
};

const getStatusBadge = (item: InventoryItem, lowStockIds: string[]) => {
  if (item.quantity === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
        <XCircleIcon className="h-3 w-3" /> Out of Stock
      </span>
    );
  }
  if (lowStockIds.includes(item.productId)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700">
        <ExclamationTriangleIcon className="h-3 w-3" /> Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
      In Stock
    </span>
  );
};

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [report, setReport] = useState<InventoryReport | null>(null);
  const [lowStockIds, setLowStockIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [adjustModal, setAdjustModal] = useState<AdjustModal | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [editReorderRow, setEditReorderRow] = useState<string | null>(null);
  const [editReorderValue, setEditReorderValue] = useState('');

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        setReport(data.data.report);
        setLowStockIds(data.data.lowStockIds);
      } else {
        setError(true);
        toast.error(data.error || 'Failed to load inventory');
      }
    } catch {
      setError(true);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAdjust = async () => {
    if (!adjustModal) return;
    const delta = parseInt(adjustDelta);
    if (isNaN(delta) || delta === 0) {
      toast.error('Enter a non-zero adjustment value');
      return;
    }
    setAdjusting(true);
    try {
      const res = await fetch(`/api/inventory?productId=${adjustModal.productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment: delta, reason: adjustReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Stock adjusted');
        setAdjustModal(null);
        setAdjustDelta('');
        setAdjustReason('');
        fetchInventory();
      } else {
        toast.error(data.error || 'Failed to adjust stock');
      }
    } catch {
      toast.error('Failed to adjust stock');
    } finally {
      setAdjusting(false);
    }
  };

  const handleSaveReorder = async (productId: string) => {
    const level = parseInt(editReorderValue);
    if (isNaN(level) || level < 0) {
      toast.error('Enter a valid reorder level');
      return;
    }
    try {
      const res = await fetch(`/api/inventory?productId=${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorderLevel: level }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Reorder level updated');
        setEditReorderRow(null);
        fetchInventory();
      } else {
        toast.error(data.error || 'Failed to update reorder level');
      }
    } catch {
      toast.error('Failed to update reorder level');
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
        <p className="text-red-600 dark:text-red-400">Failed to load inventory</p>
        <button
          onClick={fetchInventory}
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
        <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Inventory</h1>
        <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Monitor and manage stock levels</p>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
            <div className="flex items-center gap-3 mb-2">
              <ArchiveBoxIcon className="h-6 w-6 text-sage-600" />
              <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Total Products</span>
            </div>
            <p className="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8]">{report.totalProducts}</p>
          </div>
          <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
            <div className="flex items-center gap-3 mb-2">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />
              <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Low Stock</span>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{report.lowStockCount}</p>
          </div>
          <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
            <div className="flex items-center gap-3 mb-2">
              <XCircleIcon className="h-6 w-6 text-red-500" />
              <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Out of Stock</span>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{report.outOfStockCount}</p>
          </div>
          <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
            <div className="flex items-center gap-3 mb-2">
              <LockClosedIcon className="h-6 w-6 text-forest-500 dark:text-[#8A9A8A]" />
              <span className="text-sm text-forest-600 dark:text-[#C5D4C5]">Reserved</span>
            </div>
            <p className="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8]">{report.reservedStock}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Reserved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Reorder Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 dark:divide-[#3f4946]">
                {items.map((item) => (
                  <tr key={item.productId} className={`transition-colors hover:bg-cream-50 dark:hover:bg-[#2a3330] ${getRowStyle(item, lowStockIds)}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-forest-800 dark:text-[#E8EDE8]">{item.product?.nameSv || item.productId}</p>
                      {item.product?.nameEn && item.product.nameEn !== item.product.nameSv && (
                        <p className="text-xs text-forest-500 dark:text-[#6B7B6B]">{item.product.nameEn}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-forest-600 dark:text-[#8A9A8A] font-mono">{item.product?.sku || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-forest-800 dark:text-[#E8EDE8]">
                      {item.quantity - item.reservedQuantity}
                    </td>
                    <td className="px-6 py-4 text-forest-600 dark:text-[#C5D4C5]">{item.reservedQuantity}</td>
                    <td className="px-6 py-4">
                      {editReorderRow === item.productId ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={editReorderValue}
                            onChange={e => setEditReorderValue(e.target.value)}
                            className="w-20 px-2 py-1 text-sm rounded-lg border-2 border-sage-400 focus:outline-none bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8]"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveReorder(item.productId)}
                            className="p-1 text-green-600 dark:text-green-400 hover:text-green-700"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditReorderRow(null)}
                            className="p-1 text-red-500 dark:text-red-400 hover:text-red-600"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-forest-600 dark:text-[#C5D4C5]">{item.reorderLevel}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item, lowStockIds)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAdjustModal({
                            productId: item.productId,
                            productName: item.product?.nameSv || item.productId,
                            currentQty: item.quantity,
                          })}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-sage-100 dark:bg-[#2a3330] text-sage-700 dark:text-sage-400 hover:bg-sage-200 dark:hover:bg-[#343c39] transition-colors"
                        >
                          Adjust Stock
                        </button>
                        <button
                          onClick={() => {
                            setEditReorderRow(item.productId);
                            setEditReorderValue(String(item.reorderLevel));
                          }}
                          className="p-1.5 rounded-lg hover:bg-cream-100 dark:hover:bg-[#343c39] text-forest-500 dark:text-[#8A9A8A] transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-forest-500 dark:text-[#8A9A8A]">
            <ArchiveBoxIcon className="h-12 w-12 mx-auto mb-4 text-forest-300 dark:text-[#6B7B6B]" />
            <p>No inventory records found</p>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-1">Adjust Stock</h2>
            <p className="text-sm text-forest-600 dark:text-[#C5D4C5] mb-4">
              <strong>{adjustModal.productName}</strong> — current quantity: {adjustModal.currentQty}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
                  Adjustment (positive = add, negative = remove)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                  placeholder="e.g. +10 or -5"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none"
                  placeholder="e.g. Restock delivery"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setAdjustModal(null); setAdjustDelta(''); setAdjustReason(''); }}
                  className="px-5 py-2 rounded-full border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={adjusting}
                  className="px-5 py-2 rounded-full bg-sage-600 text-white font-medium hover:bg-sage-700 transition-all disabled:opacity-50"
                >
                  {adjusting ? 'Saving...' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
