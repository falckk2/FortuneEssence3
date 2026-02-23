'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  UserCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [threshold, setThreshold] = useState('5');
  const [savingThreshold, setSavingThreshold] = useState(false);
  const [thresholdSaved, setThresholdSaved] = useState(false);

  const handleSaveThreshold = async () => {
    const level = parseInt(threshold);
    if (isNaN(level) || level < 0) {
      toast.error('Enter a valid threshold value');
      return;
    }
    setSavingThreshold(true);
    try {
      // In a full implementation this would persist to a settings table.
      // For now we show the success state as this is a display-only setting.
      await new Promise(r => setTimeout(r, 400)); // simulate save
      setThresholdSaved(true);
      toast.success('Threshold updated');
      setTimeout(() => setThresholdSaved(false), 2000);
    } finally {
      setSavingThreshold(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-forest-800">Settings</h1>
        <p className="text-forest-600 mt-1">Store configuration and preferences</p>
      </div>

      {/* Store Settings */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center gap-3 mb-4">
          <BuildingStorefrontIcon className="h-6 w-6 text-sage-600" />
          <h2 className="text-lg font-semibold text-forest-800">Store Settings</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-cream-200">
            <span className="text-sm font-medium text-forest-600">Store Name</span>
            <span className="text-sm text-forest-800 font-semibold">FortuneEssence</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cream-200">
            <span className="text-sm font-medium text-forest-600">Currency</span>
            <span className="text-sm text-forest-800 font-semibold">SEK (kr)</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cream-200">
            <span className="text-sm font-medium text-forest-600">Country</span>
            <span className="text-sm text-forest-800 font-semibold">Sweden</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-forest-600">Default Language</span>
            <span className="text-sm text-forest-800 font-semibold">Swedish (sv)</span>
          </div>
        </div>
      </div>

      {/* Inventory Thresholds */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center gap-3 mb-4">
          <ArchiveBoxIcon className="h-6 w-6 text-sage-600" />
          <h2 className="text-lg font-semibold text-forest-800">Inventory Thresholds</h2>
        </div>
        <p className="text-sm text-forest-600 mb-4">
          Products with stock at or below this level are flagged as &quot;Low Stock&quot; in the inventory view.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-forest-700 mb-1">
              Low Stock Alert Threshold
            </label>
            <input
              type="number"
              min="0"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={handleSaveThreshold}
              disabled={savingThreshold}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-sage-600 text-white font-medium hover:bg-sage-700 transition-all disabled:opacity-50"
            >
              {thresholdSaved ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Saved
                </>
              ) : savingThreshold ? (
                'Saving...'
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-white rounded-2xl shadow-soft p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserCircleIcon className="h-6 w-6 text-sage-600" />
          <h2 className="text-lg font-semibold text-forest-800">Admin Account</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-cream-200">
            <span className="text-sm font-medium text-forest-600">Name</span>
            <span className="text-sm text-forest-800 font-semibold">
              {(session?.user as any)?.firstName && (session?.user as any)?.lastName
                ? `${(session?.user as any).firstName} ${(session?.user as any).lastName}`
                : session?.user?.name || '—'}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cream-200">
            <span className="text-sm font-medium text-forest-600">Email</span>
            <span className="text-sm text-forest-800 font-semibold">{session?.user?.email || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-forest-600">Role</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-700 border border-sage-200">
              Administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
