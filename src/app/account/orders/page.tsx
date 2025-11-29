'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { OrdersList } from '@/components/orders/OrdersList';

export default function AccountOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = 'sv'; // This would come from context in a real app

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account/orders');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">
              {locale === 'sv' ? 'Laddar...' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/account"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Tillbaka till konto' : 'Back to account'}
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {locale === 'sv' ? 'Mina beställningar' : 'My orders'}
              </h1>
              <p className="text-gray-600 mt-2">
                {locale === 'sv' 
                  ? 'Här kan du se alla dina beställningar och deras status'
                  : 'Here you can see all your orders and their status'
                }
              </p>
            </div>

            <Link
              href="/orders/track"
              className="px-4 py-2 border border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
            >
              {locale === 'sv' ? 'Spåra paket' : 'Track package'}
            </Link>
          </div>
        </div>

        {/* Orders List */}
        <OrdersList locale={locale} />
      </div>
    </div>
  );
}