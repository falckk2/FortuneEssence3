'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * TEST MODE CONFIGURATION PAGE
 *
 * Admin interface to enable/disable test endpoints.
 * Only accessible in development mode.
 */

interface TestConfig {
  enabled: boolean;
  environment: string;
  canToggle: boolean;
  message?: string;
}

export default function TestConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/test/config');
      const result = await response.json();
      if (result.success) {
        setConfig(result.data);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(`Failed to load configuration: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadConfig();
    }
  }, [status, router, loadConfig]);

  const toggleTestMode = async (enabled: boolean) => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/test/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(result.data?.message || 'Updated');
        setConfig(prev => prev ? { ...prev, enabled } : prev);
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(`Failed to toggle test mode: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Test Mode Configuration</h1>
        <p className="text-forest-600 dark:text-[#C5D4C5] mt-1">
          Control whether test endpoints are enabled or disabled.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-700 rounded-xl p-4">
          <p className="text-red-800 dark:text-red-300 font-semibold">❌ Error</p>
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-700 rounded-xl p-4">
          <p className="text-green-800 dark:text-green-300 font-semibold">✅ Success</p>
          <p className="text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Current Status */}
      {config && (
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
          <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Current Status</h2>
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 bg-cream-50 dark:bg-[#2a3330] rounded-xl">
              <div>
                <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Test Endpoints</p>
                <p className="text-2xl font-bold">
                  {config.enabled ? (
                    <span className="text-green-600 dark:text-green-400">ENABLED</span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">DISABLED</span>
                  )}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                config.enabled
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <span className="text-3xl">{config.enabled ? '🟢' : '🔴'}</span>
              </div>
            </div>

            {/* Environment Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-cream-50 dark:bg-[#2a3330] rounded-xl">
                <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Environment</p>
                <p className="font-semibold text-forest-800 dark:text-[#E8EDE8]">{config.environment}</p>
              </div>
              <div className="p-4 bg-cream-50 dark:bg-[#2a3330] rounded-xl">
                <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Can Toggle</p>
                <p className="font-semibold text-forest-800 dark:text-[#E8EDE8]">
                  {config.canToggle ? '✅ Yes' : '❌ No (Production)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Controls */}
      {config?.canToggle && (
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
          <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Toggle Test Mode</h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>⚠️ Important:</strong> After changing this setting, you must restart
                your development server for the changes to take effect.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => toggleTestMode(true)}
                disabled={saving || config.enabled}
                className={`p-6 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  config.enabled
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                    : 'border-cream-300 dark:border-[#3f4946] hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🟢</div>
                  <p className="font-bold text-lg mb-2 text-forest-800 dark:text-[#E8EDE8]">Enable Test Mode</p>
                  <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                    Allow test endpoints for simulated payments and orders
                  </p>
                </div>
              </button>

              <button
                onClick={() => toggleTestMode(false)}
                disabled={saving || !config.enabled}
                className={`p-6 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  !config.enabled
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                    : 'border-cream-300 dark:border-[#3f4946] hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🔴</div>
                  <p className="font-bold text-lg mb-2 text-forest-800 dark:text-[#E8EDE8]">Disable Test Mode</p>
                  <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                    Block all test endpoints for security
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">What This Controls</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">✅ When Enabled:</h3>
            <ul className="list-disc list-inside space-y-1 text-forest-700 dark:text-[#C5D4C5]">
              <li>Test checkout endpoint available at <code className="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/api/test/checkout</code></li>
              <li>Shipment simulation at <code className="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/api/test/shipment/simulate</code></li>
              <li>Order management at <code className="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/api/test/orders</code></li>
              <li>Test UI accessible at <code className="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/test-orders</code></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">🔒 When Disabled:</h3>
            <ul className="list-disc list-inside space-y-1 text-forest-700 dark:text-[#C5D4C5]">
              <li>All test endpoints return 403 Forbidden</li>
              <li>Cannot create simulated orders</li>
              <li>Better security for production-like environments</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Tip:</strong> Test endpoints are automatically enabled in development
              mode and disabled in production mode. This setting allows you to override the
              default behavior.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      {config?.enabled && (
        <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
          <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link
              href="/test-orders"
              className="block p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
            >
              <p className="font-semibold text-blue-700 dark:text-blue-300">🧪 Test Orders UI</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Create and manage test orders</p>
            </Link>
            <a
              href="/TEST_SYSTEM_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
            >
              <p className="font-semibold text-purple-700 dark:text-purple-300">📚 Test System Guide</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">Complete documentation</p>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
