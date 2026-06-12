/**
 * URL-based locale configuration (FABLE-011).
 *
 * Strategy: the default locale (sv) lives at unprefixed URLs; every other
 * locale gets a path prefix (/en/...). Middleware strips the prefix via
 * rewrite and forwards the locale in the `x-locale` request header, so page
 * files stay in their normal (unprefixed) app-router locations.
 *
 * Adding a locale (e.g. Nordic expansion): add it to `locales` and `hreflang`,
 * then add the translations to the content modules (src/data/*, the
 * `locale === 'sv' ? ... : ...` branches, and DB product translations).
 *
 * This module must stay edge- and client-safe: pure string helpers only,
 * no next/headers (see i18n-server.ts for the server-side locale reader).
 */

import type { Locale } from '@/types';

export const locales: readonly Locale[] = ['sv', 'en'] as const;
export const defaultLocale: Locale = 'sv';

/** hreflang attribute values per locale. */
export const hreflangValues: Record<Locale, string> = {
  sv: 'sv-SE',
  en: 'en',
};

export const LOCALE_HEADER = 'x-locale';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/**
 * Split a known locale prefix off a pathname.
 * '/en/about' → { locale: 'en', path: '/about' }; '/about' → { locale: 'sv', path: '/about' }.
 */
export function splitLocaleFromPath(pathname: string): { locale: Locale; path: string } {
  const segments = pathname.split('/');
  const candidate = segments[1];
  if (candidate && isLocale(candidate)) {
    const rest = '/' + segments.slice(2).join('/');
    const path = rest === '/' ? '/' : rest.replace(/\/+$/, '') || '/';
    return { locale: candidate, path };
  }
  return { locale: defaultLocale, path: pathname };
}

/**
 * Prefix an internal path for the given locale. The default locale stays
 * unprefixed. External URLs, anchors, mailto/tel and API paths pass through.
 */
export function localizePath(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path;
  if (!path.startsWith('/')) return path; // external, mailto:, tel:, '#...'
  if (path.startsWith('/api/') || path.startsWith('//')) return path;
  const { locale: existing, path: bare } = splitLocaleFromPath(path);
  if (existing !== defaultLocale) return localizePath(bare, locale); // re-prefix
  return `/${locale}${path === '/' ? '' : path}`;
}

/**
 * Metadata `alternates` for a fully translated page: locale-correct canonical
 * plus hreflang links for every locale, with the default locale as x-default.
 * Untranslated pages should NOT use this — they keep a static sv canonical so
 * the /en URL self-deduplicates against the Swedish original.
 */
export function localizedAlternates(path: string, locale: Locale) {
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[hreflangValues[l]] = localizePath(path, l);
  }
  languages['x-default'] = localizePath(path, defaultLocale);

  return {
    canonical: localizePath(path, locale),
    languages,
  };
}
