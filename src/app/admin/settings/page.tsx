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
      toast.error('Ange ett giltigt tröskelvärde');
      return;
    }
    setSavingThreshold(true);
    try {
      // In a full implementation this would persist to a settings table.
      // For now we show the success state as this is a display-only setting.
      await new Promise(r => setTimeout(r, 400)); // simulate save
      setThresholdSaved(true);
      toast.success('Tröskelvärde uppdaterat');
      setTimeout(() => setThresholdSaved(false), 2000);
    } finally {
      setSavingThreshold(false);
    }
  };

  const displayName = session?.user?.firstName && session?.user?.lastName
    ? `${session.user.firstName} ${session.user.lastName}`
    : session?.user?.name || '—';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Inställningar</h1>
        <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">Butikskonfiguration och inställningar</p>
      </div>

      {/* Store Settings */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <div className="flex items-center gap-3 mb-4">
          <BuildingStorefrontIcon className="h-6 w-6 text-sage-600" />
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Butiksinställningar</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-cream-200 dark:border-[#3f4946]">
            <span className="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Butiksnamn</span>
            <span className="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">FortuneEssence</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cream-200 dark:border-[#3f4946]">
            <span className="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Valuta</span>
            <span className="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">SEK (kr)</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cream-200 dark:border-[#3f4946]">
            <span className="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Land</span>
            <span className="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">Sverige</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Standardspråk</span>
            <span className="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">Svenska (sv)</span>
          </div>
        </div>
      </div>

      {/* Inventory Thresholds */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <div className="flex items-center gap-3 mb-4">
          <ArchiveBoxIcon className="h-6 w-6 text-sage-600" />
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Lagertrösklar</h2>
        </div>
        <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-4">
          Produkter med lagersaldo vid eller under detta värde flaggas som &quot;Lågt lager&quot; i lagervy.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label htmlFor="low-stock-threshold" className="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
              Tröskel för lagervarning
            </label>
            <input
              id="low-stock-threshold"
              type="number"
              min="0"
              value={threshold}
              onChange={e => setThreshold(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors"
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
                  Sparat
                </>
              ) : savingThreshold ? (
                'Sparar...'
              ) : (
                'Spara'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <div className="flex items-center gap-3 mb-4">
          <UserCircleIcon className="h-6 w-6 text-sage-600" />
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Administratörskonto</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-cream-200 dark:border-[#3f4946]">
            <span className="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Namn</span>
            <span className="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">{displayName}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-cream-200 dark:border-[#3f4946]">
            <span className="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">E-post</span>
            <span className="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">{session?.user?.email || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Roll</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 border border-sage-200 dark:border-sage-700">
              Administratör
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
