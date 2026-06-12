import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import ShippingPolicyContent from './ShippingPolicyContent';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Fraktpolicy',
        description:
          'Information om leveranstider, fraktkostnader, spårning och leveransmetoder hos Fortune Essence. Fri frakt över 500 kr.',
        alternates: localizedAlternates('/shipping-policy', locale),
      }
    : {
        title: 'Shipping & Delivery',
        description:
          'Information about delivery times, shipping costs, tracking and delivery methods at Fortune Essence. Free shipping over 500 SEK.',
        alternates: localizedAlternates('/shipping-policy', locale),
      };
}

export default async function ShippingPolicyPage() {
  return <ShippingPolicyContent locale={await getRequestLocale()} />;
}
