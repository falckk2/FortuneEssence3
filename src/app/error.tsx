'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = 'sv'; // Would come from context in real app

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Error Visual */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-800 mb-4">
          {locale === 'sv' ? 'Något gick fel' : 'Something went wrong'}
        </h1>
        <p className="text-lg text-forest-600 mb-8 max-w-md mx-auto">
          {locale === 'sv'
            ? 'Ett oväntat fel uppstod. Vi har loggat problemet och arbetar på en lösning.'
            : "An unexpected error occurred. We've logged the issue and are working on a fix."
          }
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-left max-w-2xl mx-auto">
            <p className="font-mono text-sm text-red-800 mb-2">
              <strong>Error:</strong> {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-red-600">
                <strong>Digest:</strong> {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
          >
            <ArrowPathIcon className="h-5 w-5" />
            {locale === 'sv' ? 'Försök igen' : 'Try Again'}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-forest-800 font-semibold border-2 border-cream-300 hover:border-sage-600 hover:bg-sage-50 transition-all shadow-lg"
          >
            <HomeIcon className="h-5 w-5" />
            {locale === 'sv' ? 'Tillbaka till startsidan' : 'Back to Home'}
          </Link>
        </div>

        {/* Support Link */}
        <div className="bg-white rounded-3xl shadow-soft p-8">
          <h3 className="font-semibold text-forest-800 mb-2">
            {locale === 'sv' ? 'Behöver du hjälp?' : 'Need Help?'}
          </h3>
          <p className="text-forest-600 mb-4">
            {locale === 'sv'
              ? 'Om problemet kvarstår, kontakta vår kundservice.'
              : 'If the problem persists, please contact our support team.'
            }
          </p>
          <Link
            href="/contact"
            className="text-sage-700 hover:text-sage-800 font-semibold hover:underline transition-colors"
          >
            {locale === 'sv' ? 'Kontakta oss →' : 'Contact Us →'}
          </Link>
        </div>
      </div>
    </div>
  );
}
