'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

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
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const locale = 'sv'; // This would come from context in a real app

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (!session) {
      router.push('/auth/signin?callbackUrl=/account');
      return;
    }
    
    fetchOrderStats();
  }, [session, status, router]);

  const fetchOrderStats = async () => {
    try {
      const response = await fetch('/api/orders?action=statistics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {locale === 'sv' ? 'Mitt konto' : 'My account'}
              </h1>
              <p className="text-gray-600 mt-2">
                {locale === 'sv' 
                  ? `Välkommen tillbaka, ${session.user?.name || session.user?.email}`
                  : `Welcome back, ${session.user?.name || session.user?.email}`
                }
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
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
            {stats && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {locale === 'sv' ? 'Orderöversikt' : 'Order overview'}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-blue-600">
                      {locale === 'sv' ? 'Totalt' : 'Total'}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-yellow-600">
                      {locale === 'sv' ? 'Väntar' : 'Pending'}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
                    <div className="text-sm text-purple-600">
                      {locale === 'sv' ? 'Skickade' : 'Shipped'}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                    <div className="text-sm text-green-600">
                      {locale === 'sv' ? 'Levererade' : 'Delivered'}
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
                  className="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
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
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {session.user?.name || 'Användare'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              
              <Link
                href="/account/settings"
                className="w-full bg-purple-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-center block"
              >
                {locale === 'sv' ? 'Redigera profil' : 'Edit profile'}
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {locale === 'sv' ? 'Snabbåtgärder' : 'Quick actions'}
              </h3>
              
              <div className="space-y-3">
                <Link
                  href="/orders/track"
                  className="block w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Spåra paket' : 'Track package'}
                </Link>
                
                <Link
                  href="/products"
                  className="block w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
                </Link>
                
                <Link
                  href="/contact"
                  className="block w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
                </Link>
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-gradient-to-r from-purple-50 to-yellow-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {locale === 'sv' ? 'Behöver du hjälp?' : 'Need help?'}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {locale === 'sv' 
                  ? 'Vårt kundserviceteam är här för att hjälpa dig.'
                  : 'Our customer service team is here to help you.'
                }
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                {locale === 'sv' ? 'Kontakta support' : 'Contact support'}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}