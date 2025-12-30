'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale } from '@/types';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
  defaultLocale?: Locale;
}

/**
 * Detect user's preferred locale based on:
 * 1. Saved preference in localStorage
 * 2. Browser language
 * 3. Default fallback to Swedish (sv)
 */
const detectUserLocale = (): Locale => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return 'sv'; // Default to Swedish on server
  }

  // 1. Check localStorage for saved preference
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale === 'sv' || savedLocale === 'en') {
    return savedLocale;
  }

  // 2. Check browser language
  const browserLang = navigator.language.toLowerCase();

  // Check if browser language starts with 'en' (en, en-US, en-GB, etc.)
  if (browserLang.startsWith('en')) {
    return 'en';
  }

  // Check if browser language starts with 'sv' (sv, sv-SE, etc.)
  if (browserLang.startsWith('sv')) {
    return 'sv';
  }

  // 3. Check for Nordic countries (default to Swedish for regional relevance)
  const nordicLanguages = ['no', 'nb', 'nn', 'da', 'fi', 'is'];
  if (nordicLanguages.some(lang => browserLang.startsWith(lang))) {
    return 'sv';
  }

  // 4. Default to Swedish (primary market)
  return 'sv';
};

export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  children,
  defaultLocale
}) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Use provided default or detect user's preference
    return defaultLocale || detectUserLocale();
  });

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Re-detect locale on client mount to ensure consistency
    if (!defaultLocale) {
      const detectedLocale = detectUserLocale();
      setLocaleState(detectedLocale);
    }
  }, [defaultLocale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);

    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);

      // Update HTML lang attribute for accessibility and SEO
      document.documentElement.lang = newLocale === 'sv' ? 'sv' : 'en';
    }
  };

  const toggleLocale = () => {
    const newLocale = locale === 'sv' ? 'en' : 'sv';
    setLocale(newLocale);
  };

  // Update HTML lang attribute when locale changes
  useEffect(() => {
    if (isClient) {
      document.documentElement.lang = locale === 'sv' ? 'sv' : 'en';
    }
  }, [locale, isClient]);

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
