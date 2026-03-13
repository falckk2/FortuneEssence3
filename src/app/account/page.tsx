'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  UserIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useLocale } from '@/contexts/LocaleContext';

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { locale } = useLocale();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const fetchOrderStats = useCallback(async () => {
    try {
      const response = await fetch('/api/orders?action=statistics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        } else {
          setStatsError(true);
        }
      } else {
        setStatsError(true);
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      setStatsError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setLoading(false);
      router.push('/auth/signin?callbackUrl=/account');
      return;
    }
    fetchOrderStats();
  }, [session, status, router, fetchOrderStats]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600" />
            <span className="ml-3 text-forest-600 dark:text-[#C5D4C5]">
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

  const menuItems = [
    {
      title: locale === 'sv' ? 'Mina beställningar' : 'My orders',
      description: locale === 'sv'
        ? 'Se alla dina beställningar och deras status'
        : 'View all your orders and their status',
      href: '/account/orders',
      icon: ClipboardDocumentListIcon,
      badge: stats?.total || 0,
    },
    {
      title: locale === 'sv' ? 'Kontoinställningar' : 'Account settings',
      description: locale === 'sv'
        ? 'Hantera dina personuppgifter och lösenord'
        : 'Manage your personal information and password',
      href: '/account/settings',
      icon: CogIcon,
    },
    {
      title: locale === 'sv' ? 'GDPR & Integritet' : 'GDPR & Privacy',
      description: locale === 'sv'
        ? 'Hantera dina data och integritetsinställningar'
        : 'Manage your data and privacy settings',
      href: '/account/privacy',
      icon: ShieldCheckIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">
                {locale === 'sv' ? 'Mitt konto' : 'My account'}
              </h1>
              <p className="text-forest-600 dark:text-[#C5D4C5] mt-2">
                {locale === 'sv'
                  ? `Välkommen tillbaka, ${session.user?.name || session.user?.email}`
                  : `Welcome back, ${session.user?.name || session.user?.email}`
                }
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              {locale === 'sv' ? 'Logga ut' : 'Sign out'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Quick Stats */}
            {statsError && (
              <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-soft p-6 mb-8">
                <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                  {locale === 'sv' ? 'Kunde inte ladda orderstatistik.' : 'Could not load order statistics.'}
                </p>
              </div>
            )}
            {stats && (
              <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-soft p-6 mb-8">
                <h2 className="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-6">
                  {locale === 'sv' ? 'Orderöversikt' : 'Order overview'}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-sage-50 dark:bg-[#2a3330] rounded-lg">
                    <div className="text-2xl font-bold text-sage-700 dark:text-sage-400">{stats.total}</div>
                    <div className="text-sm text-sage-600 dark:text-[#8A9A8A]">
                      {locale === 'sv' ? 'Totalt' : 'Total'}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</div>
                    <div className="text-sm text-yellow-600 dark:text-yellow-500">
                      {locale === 'sv' ? 'Väntar' : 'Pending'}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.shipped}</div>
                    <div className="text-sm text-indigo-600 dark:text-indigo-500">
                      {locale === 'sv' ? 'Skickade' : 'Shipped'}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.delivered}</div>
                    <div className="text-sm text-green-600 dark:text-green-500">
                      {locale === 'sv' ? 'Levererade' : 'Delivered'}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.confirmed}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-500">
                      {locale === 'sv' ? 'Bekräftade' : 'Confirmed'}
                    </div>
                  </div>

                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelled}</div>
                    <div className="text-sm text-red-600 dark:text-red-500">
                      {locale === 'sv' ? 'Avbrutna' : 'Cancelled'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block bg-white dark:bg-[#242a28] rounded-xl shadow-soft p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-sage-100 dark:bg-[#2a3330] rounded-lg flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-sage-600 dark:text-sage-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">
                          {item.title}
                        </h3>
                        <p className="text-forest-600 dark:text-[#C5D4C5] text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-sage-100 dark:bg-[#2a3330] text-sage-800 dark:text-sage-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRightIcon className="w-5 h-5 text-forest-400 dark:text-[#6B7B6B]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-soft p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-sage-100 dark:bg-[#2a3330] rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-sage-600 dark:text-sage-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-forest-800 dark:text-[#E8EDE8]">
                    {session.user?.name || (locale === 'sv' ? 'Användare' : 'User')}
                  </h3>
                  <p className="text-forest-600 dark:text-[#C5D4C5] text-sm">
                    {session.user?.email}
                  </p>
                </div>
              </div>

              <Link
                href="/account/settings"
                className="w-full bg-sage-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-sage-700 transition-colors text-center block"
              >
                {locale === 'sv' ? 'Redigera profil' : 'Edit profile'}
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-[#242a28] rounded-xl shadow-soft p-6">
              <h3 className="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">
                {locale === 'sv' ? 'Snabbåtgärder' : 'Quick actions'}
              </h3>

              <div className="space-y-1">
                <Link
                  href="/account/orders"
                  className="block w-full text-left px-4 py-2 text-sage-700 dark:text-sage-400 hover:bg-sage-50 dark:hover:bg-[#2a3330] rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Spåra paket' : 'Track package'}
                </Link>

                <Link
                  href="/products"
                  className="block w-full text-left px-4 py-2 text-sage-700 dark:text-sage-400 hover:bg-sage-50 dark:hover:bg-[#2a3330] rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
                </Link>

                <Link
                  href="/contact"
                  className="block w-full text-left px-4 py-2 text-sage-700 dark:text-sage-400 hover:bg-sage-50 dark:hover:bg-[#2a3330] rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
                </Link>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-cream-100 dark:bg-[#2a3330] rounded-xl p-6 border border-cream-200 dark:border-[#3f4946]">
              <h3 className="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">
                {locale === 'sv' ? 'Behöver du hjälp?' : 'Need help?'}
              </h3>
              <p className="text-forest-600 dark:text-[#C5D4C5] text-sm mb-4">
                {locale === 'sv'
                  ? 'Vårt kundserviceteam är här för att hjälpa dig.'
                  : 'Our customer service team is here to help you.'
                }
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center text-sage-700 dark:text-sage-400 hover:text-sage-800 font-medium text-sm transition-colors"
              >
                {locale === 'sv' ? 'Kontakta support' : 'Contact support'}
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
