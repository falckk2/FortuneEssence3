import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import ContactClient from './ContactClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Kontakta oss',
        description:
          'Kontakta Fortune Essence — vi hjälper dig med frågor om produkter, beställningar, leveranser och returer.',
        alternates: localizedAlternates('/contact', locale),
      }
    : {
        title: 'Contact us',
        description:
          'Contact Fortune Essence — we help you with questions about products, orders, deliveries and returns.',
        alternates: localizedAlternates('/contact', locale),
      };
}

export default function ContactPage() {
  return <ContactClient />;
}
