import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import { buildFaqJsonLd } from '@/data/faq';
import FaqClient from './FaqClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Vanliga frågor (FAQ)',
        description:
          'Svar på vanliga frågor om eteriska oljor, användning, säkerhet, leverans och returer hos Fortune Essence.',
        alternates: localizedAlternates('/faq', locale),
      }
    : {
        title: 'Frequently asked questions (FAQ)',
        description:
          'Answers to common questions about essential oils, usage, safety, delivery and returns at Fortune Essence.',
        alternates: localizedAlternates('/faq', locale),
      };
}

export default async function FaqPage() {
  const locale = await getRequestLocale();
  // The CSP is nonce-based (src/middleware.ts) — inline JSON-LD must carry the nonce.
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd(locale)) }}
      />
      <FaqClient />
    </>
  );
}
