import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import TrackOrderClient from './TrackOrderClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Spåra din beställning',
        description:
          'Spåra din beställning från Fortune Essence med ordernummer och e-post eller med ditt spårningsnummer.',
        alternates: localizedAlternates('/track-order', locale),
      }
    : {
        title: 'Track your order',
        description:
          'Track your Fortune Essence order with your order number and email, or with your tracking number.',
        alternates: localizedAlternates('/track-order', locale),
      };
}

export default function TrackOrderPage() {
  return <TrackOrderClient />;
}
