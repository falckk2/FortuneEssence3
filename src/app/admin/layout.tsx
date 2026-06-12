'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from '@/components/i18n/Link';
import { useAuth } from '@/hooks/useAuth';
import {
  HomeIcon,
  ShoppingBagIcon,
  CubeIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  ArchiveBoxIcon,
  SwatchIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Översikt', href: '/admin', icon: HomeIcon, exact: true },
  { name: 'Produkter', href: '/admin/products', icon: CubeIcon },
  { name: 'Lager', href: '/admin/inventory', icon: ArchiveBoxIcon },
  { name: 'Paket', href: '/admin/bundles', icon: SwatchIcon },
  { name: 'Beställningar', href: '/admin/orders', icon: ShoppingBagIcon },
  { name: 'Returer', href: '/admin/returns', icon: ArrowUturnLeftIcon },
  { name: 'Kunder', href: '/admin/customers', icon: UserGroupIcon },
  { name: 'Analys', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Inställningar', href: '/admin/settings', icon: Cog6ToothIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('adminSidebarOpen') === 'false') {
      setIsSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('adminSidebarOpen', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/auth/signin?redirect=/admin');
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#1a1f1e]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-forest-900 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-forest-700">
            <Link href="/admin" className="text-xl font-serif font-bold text-white">
              Admin Panel
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-sage-600 text-white'
                      : 'text-forest-300 hover:bg-forest-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Back to Store */}
          <div className="p-4 border-t border-forest-700">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-forest-300 hover:bg-forest-800 hover:text-white transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5 shrink-0" />
              <span className="font-medium">Tillbaka till butiken</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-white dark:bg-[#242a28] border-b border-cream-200 dark:border-[#3f4946] h-16 flex items-center justify-between px-6">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors"
            aria-label="Växla sidopanel"
          >
            <Bars3Icon className="w-6 h-6 text-forest-700 dark:text-[#C5D4C5]" />
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">
              Välkommen, <span className="font-semibold text-forest-800 dark:text-[#E8EDE8]">{user?.firstName || 'Admin'}</span>
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
