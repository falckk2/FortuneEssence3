import type { Metadata } from 'next';
import { localizedAlternates } from '@/lib/i18n';
import { getRequestLocale } from '@/lib/i18n-server';
import HowToUseClient from './HowToUseClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return locale === 'sv'
    ? {
        title: 'Användningsguide – Så använder du eteriska oljor',
        description:
          'Praktisk guide till hur du använder eteriska oljor säkert: diffuser, hudvård, massage, dosering och säkerhetsråd.',
        alternates: localizedAlternates('/how-to-use', locale),
      }
    : {
        title: 'How to use essential oils – A practical guide',
        description:
          'Practical guide to using essential oils safely: diffusers, skincare, massage, dosage and safety advice.',
        alternates: localizedAlternates('/how-to-use', locale),
      };
}

export default function HowToUsePage() {
  return <HowToUseClient />;
}
