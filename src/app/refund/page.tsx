import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import RefundContent from './RefundContent';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Återbetalningspolicy',
        description:
          'Returer och återbetalningar hos Fortune Essence — ångerrätt, returprocess och hur du får pengarna tillbaka.',
        alternates: localizedAlternates('/refund', locale),
      }
    : {
        title: 'Return & Refund Policy',
        description:
          'Returns and refunds at Fortune Essence — right of withdrawal, the return process and how you get your money back.',
        alternates: localizedAlternates('/refund', locale),
      };
}

export default async function RefundPage() {
  return <RefundContent locale={await getRequestLocale()} />;
}
