'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { localizePath } from '@/lib/i18n';

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Locale-aware drop-in replacement for next/link (FABLE-011). Internal hrefs
 * are prefixed with the current non-default locale (/en/...), so navigation
 * stays inside the visitor's language. External URLs, anchors and UrlObject
 * hrefs pass through untouched.
 *
 * New code should import Link from '@/components/i18n/Link', not 'next/link'.
 */
export default function Link({ href, ...rest }: LinkProps) {
  const { locale } = useLocale();
  const localizedHref = typeof href === 'string' ? localizePath(href, locale) : href;
  return <NextLink href={localizedHref} {...rest} />;
}
