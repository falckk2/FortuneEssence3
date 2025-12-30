'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * TEST MODE CONFIGURATION PAGE
 *
 * Admin interface to enable/disable test endpoints.
 * Only accessible in development mode.
 */

export default function TestConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadConfig();
    }
  }, [status]);

  const loadConfig = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/test/config');
      const result = await response.json();

      if (result.success) {
        setConfig(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`Failed to load configuration: ${err}`);
    } finally {
      setLoading(false);
    }
  };

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
        setSuccess(result.data.message);
        setConfig({ ...config, enabled });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(`Failed to toggle test mode: ${err}`);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Test Mode Configuration</h1>
          <p className="text-gray-600">
            Control whether test endpoints are enabled or disabled.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">❌ Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">✅ Success</p>
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Current Status */}
        {config && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>

            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Test Endpoints</p>
                  <p className="text-2xl font-bold">
                    {config.enabled ? (
                      <span className="text-green-600">ENABLED</span>
                    ) : (
                      <span className="text-red-600">DISABLED</span>
                    )}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  config.enabled ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {config.enabled ? (
                    <span className="text-3xl">🟢</span>
                  ) : (
                    <span className="text-3xl">🔴</span>
                  )}
                </div>
              </div>

              {/* Environment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Environment</p>
                  <p className="font-semibold">{config.environment}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Can Toggle</p>
                  <p className="font-semibold">
                    {config.canToggle ? '✅ Yes' : '❌ No (Production)'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Controls */}
        {config && config.canToggle && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Toggle Test Mode</h2>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> After changing this setting, you must restart
                  your development server for the changes to take effect.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => toggleTestMode(true)}
                  disabled={saving || config.enabled}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    config.enabled
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🟢</div>
                    <p className="font-bold text-lg mb-2">Enable Test Mode</p>
                    <p className="text-sm text-gray-600">
                      Allow test endpoints for simulated payments and orders
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => toggleTestMode(false)}
                  disabled={saving || !config.enabled}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    !config.enabled
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-500 hover:bg-red-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔴</div>
                    <p className="font-bold text-lg mb-2">Disable Test Mode</p>
                    <p className="text-sm text-gray-600">
                      Block all test endpoints for security
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">What This Controls</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">✅ When Enabled:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>Test checkout endpoint available at <code className="bg-gray-100 px-2 py-1 rounded">/api/test/checkout</code></li>
                <li>Shipment simulation at <code className="bg-gray-100 px-2 py-1 rounded">/api/test/shipment/simulate</code></li>
                <li>Order management at <code className="bg-gray-100 px-2 py-1 rounded">/api/test/orders</code></li>
                <li>Test UI accessible at <code className="bg-gray-100 px-2 py-1 rounded">/test-orders</code></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-red-700 mb-2">🔒 When Disabled:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>All test endpoints return 403 Forbidden</li>
                <li>Cannot create simulated orders</li>
                <li>Better security for production-like environments</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Test endpoints are automatically enabled in development
                mode and disabled in production mode. This setting allows you to override the
                default behavior.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        {config && config.enabled && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <a
                href="/test-orders"
                className="block p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <p className="font-semibold text-blue-700">🧪 Test Orders UI</p>
                <p className="text-sm text-blue-600">Create and manage test orders</p>
              </a>
              <a
                href="/TEST_SYSTEM_GUIDE.md"
                target="_blank"
                className="block p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <p className="font-semibold text-purple-700">📚 Test System Guide</p>
                <p className="text-sm text-purple-600">Complete documentation</p>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
