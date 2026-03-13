'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { OrdersList } from '@/components/orders/OrdersList';
import { useLocale } from '@/contexts/LocaleContext';

export default function AccountOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useLocale();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account/orders');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f5f5f0] to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5c7a5c] dark:border-[#8aab8a]"></div>
            <span className="ml-3 text-[#4a5568] dark:text-[#C5D4C5]">
              {locale === 'sv' ? 'Laddar...' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f5f0] to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/account"
            className="inline-flex items-center text-[#5c7a5c] dark:text-[#8aab8a] hover:text-[#4a6a4a] dark:hover:text-[#C5D4C5] mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {locale === 'sv' ? 'Tillbaka till konto' : 'Back to account'}
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#1a2e1a] dark:text-[#E8EDE8]">
                {locale === 'sv' ? 'Mina beställningar' : 'My orders'}
              </h1>
              <p className="text-[#4a5568] dark:text-[#C5D4C5] mt-2">
                {locale === 'sv'
                  ? 'Här kan du se alla dina beställningar och deras status'
                  : 'Here you can see all your orders and their status'}
              </p>
            </div>

            <Link
              href="/orders/track"
              className="px-4 py-2 border border-[#5c7a5c] dark:border-[#8aab8a] text-[#5c7a5c] dark:text-[#8aab8a] font-medium rounded-lg hover:bg-[#5c7a5c]/10 dark:hover:bg-[#8aab8a]/10 transition-colors"
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
