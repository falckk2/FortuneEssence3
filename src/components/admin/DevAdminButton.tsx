'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * Floating Admin Button (Development Only)
 *
 * A floating button in the bottom-right corner that provides quick access to:
 * - Test Mode Toggle
 * - Test Orders
 * - Admin Settings
 *
 * Only visible in development mode and when user is authenticated.
 */

export default function DevAdminButton() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [testModeEnabled, setTestModeEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Only show in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (session && isDevelopment) {
      checkTestModeStatus();
    }
  }, [session, isDevelopment]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const checkTestModeStatus = async () => {
    try {
      const response = await fetch('/api/test/config');
      const result = await response.json();
      if (result.success) {
        setTestModeEnabled(result.data.enabled);
      }
    } catch (error) {
      console.error('Failed to check test mode status:', error);
    }
  };

  const toggleTestMode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !testModeEnabled }),
      });

      const result = await response.json();
      if (result.success) {
        setTestModeEnabled(!testModeEnabled);
        // Show notification
        alert(result.data.message + '\n\nPlease restart your server for changes to take effect.');
      } else {
        alert('Failed to toggle test mode: ' + result.error);
      }
    } catch (error) {
      alert('Error toggling test mode: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not in development or not authenticated
  if (!isDevelopment || !session) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={menuRef}>
      {/* Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden mb-2 animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
            <h3 className="font-bold text-lg">🛠️ Dev Admin Panel</h3>
            <p className="text-xs text-purple-100">Development Mode Only</p>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* Test Mode Toggle */}
            <button
              onClick={toggleTestMode}
              disabled={isLoading || testModeEnabled === null}
              className={`w-full flex items-center justify-between p-3 rounded-lg mb-2 transition-all ${
                testModeEnabled
                  ? 'bg-green-50 hover:bg-green-100 border border-green-300'
                  : 'bg-red-50 hover:bg-red-100 border border-red-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {testModeEnabled ? '🟢' : '🔴'}
                </span>
                <div className="text-left">
                  <p className="font-semibold text-sm">Test Mode</p>
                  <p className="text-xs text-gray-600">
                    {isLoading
                      ? 'Toggling...'
                      : testModeEnabled === null
                      ? 'Loading...'
                      : testModeEnabled
                      ? 'Currently ON'
                      : 'Currently OFF'}
                  </p>
                </div>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Test Orders */}
            <Link
              href="/test-orders"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-2xl">🧪</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm group-hover:text-blue-600">
                  Test Orders
                </p>
                <p className="text-xs text-gray-600">
                  Create & manage test orders
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            {/* Admin Settings */}
            <Link
              href="/admin/test-config"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-2xl">⚙️</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm group-hover:text-purple-600">
                  Test Config
                </p>
                <p className="text-xs text-gray-600">
                  Advanced test settings
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>

            {/* Divider */}
            <div className="border-t border-gray-200 my-2"></div>

            {/* Documentation */}
            <a
              href="/TEST_SYSTEM_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <span className="text-2xl">📚</span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm group-hover:text-gray-700">
                  Documentation
                </p>
                <p className="text-xs text-gray-600">
                  Test system guide
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 text-center">
            <p className="text-xs text-gray-500">
              💡 Only visible in development
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 ${
          isOpen
            ? 'bg-purple-600 rotate-45'
            : 'bg-gradient-to-r from-purple-600 to-blue-600'
        } text-white hover:shadow-xl`}
        aria-label="Open dev admin menu"
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
      </button>

      {/* Badge - Show test mode status */}
      {testModeEnabled !== null && !isOpen && (
        <div
          className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
            testModeEnabled ? 'bg-green-500' : 'bg-red-500'
          } border-2 border-white`}
          title={testModeEnabled ? 'Test Mode ON' : 'Test Mode OFF'}
        ></div>
      )}
    </div>
  );
}
