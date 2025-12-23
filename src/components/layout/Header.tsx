'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { CartIcon } from '@/components/cart/CartIcon';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useWishlistStore } from '@/stores/wishlistStore';

interface HeaderProps {
  locale?: 'sv' | 'en';
}

interface NavigationItem {
  name: string;
  href: string;
  children?: NavigationItem[];
}

export const Header = ({ locale = 'sv' }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const { getItemCount } = useWishlistStore();

  const navigationItems: NavigationItem[] = [
    {
      name: locale === 'sv' ? 'Hem' : 'Home',
      href: '/',
    },
    {
      name: locale === 'sv' ? 'Produkter' : 'Products',
      href: '/products',
    },
    {
      name: locale === 'sv' ? 'Instruktioner' : 'Essential Oil Guide',
      href: '/how-to-use',
    },
    // About page removed per user request
    // {
    //   name: locale === 'sv' ? 'Om oss' : 'About',
    //   href: '/about',
    // },
    {
      name: locale === 'sv' ? 'Kontakt' : 'Contact',
      href: '/contact',
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const wishlistCount = getItemCount();

  return (
    <header className="bg-white dark:bg-[#242a28] shadow-sm border-b border-gray-200 dark:border-gray-700">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-sage-100 to-cream-100 dark:from-[#2a3330] dark:to-[#1f2624] border-b border-sage-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <p className="text-forest-700 dark:text-[#B8C5B8]">
              {locale === 'sv'
                ? 'Fri frakt över 500 kr | Snabb leverans i hela Sverige'
                : 'Free shipping over 500 SEK | Fast delivery across Sweden'
              }
            </p>
            <div className="flex items-center space-x-4">
              <Link
                href="/help"
                className="text-forest-600 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors font-medium"
              >
                {locale === 'sv' ? 'Hjälp' : 'Help'}
              </Link>
              <button className="text-forest-600 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors font-medium">
                {locale === 'sv' ? 'SV' : 'EN'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                {/* Botanical leaf icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-sage-500 to-forest-600 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 4.5-4.5 7.5-9 9 4.5 1.5 7.5 4.5 9 9 1.5-4.5 4.5-7.5 9-9-4.5-1.5-7.5-4.5-9-9z" />
                  </svg>
                </div>
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-sage-400 rounded-full blur-md opacity-20 group-hover:opacity-30 transition-opacity"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] tracking-tight leading-none group-hover:text-sage-700 dark:group-hover:text-sage-400 transition-colors">
                  Fortune Essence
                </span>
                <span className="text-xs text-sage-600 dark:text-[#8A9A8A] font-light tracking-widest uppercase">
                  Premium Essential Oils
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className="text-forest-700 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
                {item.children && (
                  <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-[#2a3330] ring-1 ring-black ring-opacity-5 dark:ring-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'sv' ? 'Sök produkter...' : 'Search products...'}
                className="w-full pl-10 pr-4 py-2 border border-sage-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 dark:focus:ring-sage-600 focus:border-transparent bg-cream-50 dark:bg-[#2a3330] focus:bg-white dark:focus:bg-[#343c39] text-forest-700 dark:text-[#E8EDE8] placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-600" />
              </div>
            </form>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Search icon for mobile */}
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors">
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors">
              <HeartIcon className="h-6 w-6" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <CartIcon locale={locale} />

            {/* User menu */}
            <div className="relative group">
              <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors">
                <UserIcon className="h-6 w-6" />
              </button>

              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-[#2a3330] ring-1 ring-black ring-opacity-5 dark:ring-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] border-b border-sage-200 dark:border-gray-700">
                        {locale === 'sv' ? 'Hej' : 'Hello'} {user?.firstName}
                      </div>
                      <Link
                        href="/account"
                        className="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors"
                      >
                        {locale === 'sv' ? 'Mitt konto' : 'My Account'}
                      </Link>
                      <Link
                        href="/orders"
                        className="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors"
                      >
                        {locale === 'sv' ? 'Mina beställningar' : 'My Orders'}
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors"
                      >
                        {locale === 'sv' ? 'Logga ut' : 'Sign Out'}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/signin"
                        className="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors"
                      >
                        {locale === 'sv' ? 'Logga in' : 'Sign In'}
                      </Link>
                      <Link
                        href="/auth/signup"
                        className="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors"
                      >
                        {locale === 'sv' ? 'Skapa konto' : 'Sign Up'}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 dark:bg-[#242a28]">
          <div className="px-4 py-3 space-y-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === 'sv' ? 'Sök produkter...' : 'Search products...'}
                className="w-full pl-10 pr-4 py-2 border border-sage-300 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 dark:focus:ring-sage-600 focus:border-transparent bg-cream-50 dark:bg-[#2a3330] focus:bg-white dark:focus:bg-[#343c39] text-forest-700 dark:text-[#E8EDE8] transition-colors"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-600" />
              </div>
            </form>

            {/* Mobile navigation */}
            {navigationItems.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="block py-2 text-forest-700 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] font-medium transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.children && (
                  <div className="pl-4 space-y-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className="block py-1 text-sm text-forest-600 dark:text-[#8A9A8A] hover:text-sage-700 dark:hover:text-[#B8C5B8] transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};