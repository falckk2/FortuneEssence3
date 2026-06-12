/**
 * Server-only locale reader (kept out of i18n.ts so that module stays safe to
 * import from middleware and client components).
 */

import { headers } from 'next/headers';
import type { Locale } from '@/types';
import { defaultLocale, isLocale, LOCALE_HEADER } from '@/lib/i18n';

/** Locale of the current request, as resolved by middleware (x-locale). */
export async function getRequestLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER) ?? '';
  return isLocale(value) ? value : defaultLocale;
}
