'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Locale } from '@/types';
import { localizePath, splitLocaleFromPath, LOCALE_COOKIE } from '@/lib/i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
}

/**
 * URL-driven locale (FABLE-011): the path prefix is the single source of
 * truth (/en/... = English, unprefixed = Swedish). Switching locale navigates
 * to the same page under the other prefix; middleware handles first-visit
 * browser-language detection, so no client-side detection happens here.
 */
export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();

  const { locale, path } = splitLocaleFromPath(pathname ?? '/');

  // Keep <html lang> in sync across client-side navigations.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    // Persist the preference for middleware's first-visit detection.
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=31536000; samesite=lax`;

    router.push(localizePath(path, newLocale));
  };

  const toggleLocale = () => {
    setLocale(locale === 'sv' ? 'en' : 'sv');
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};

/**
 * Hook to access locale context
 * @throws Error if used outside LocaleProvider
 */
export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
