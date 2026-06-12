import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/gdpr/CookieConsent";
import { AdvisorProvider } from "@/contexts/AdvisorContext";
import { getRequestLocale } from "@/lib/i18n-server";
import { Toaster } from 'react-hot-toast';
import dynamic from "next/dynamic";
const DevAdminButton = dynamic(() => import("@/components/admin/DevAdminButton"));
const OilAdvisorWidget = dynamic(() => import("@/components/advisor/OilAdvisorWidget").then(m => m.OilAdvisorWidget));
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
if (!process.env.NEXT_PUBLIC_APP_URL) {
  // metadataBase, OG urls, sitemap and robots all derive from this — a missing
  // value in production silently breaks canonical/OG URL resolution.
  console.warn('[layout] NEXT_PUBLIC_APP_URL is not set — falling back to http://localhost:3000');
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  const description = locale === 'sv'
    ? 'Upptäck premium eteriska oljor och aromaterapiprodukter. Naturligt, ekologiskt och etiskt framställt av Fortune Essence.'
    : 'Discover premium essential oils and aromatherapy products. Natural, organic, and ethically sourced from Fortune Essence.';

  return {
    metadataBase: new URL(appUrl),
    title: {
      default: 'Fortune Essence - Premium Essential Oils',
      template: '%s | Fortune Essence',
    },
    description,
    authors: [{ name: 'Fortune Essence' }],
    robots: 'index, follow',
    // Icons come from the App Router file conventions:
    // src/app/icon.png, src/app/apple-icon.png, src/app/favicon.ico
    openGraph: {
      title: 'Fortune Essence - Premium Essential Oils',
      description,
      type: 'website',
      locale: locale === 'sv' ? 'sv_SE' : 'en_US',
      alternateLocale: locale === 'sv' ? 'en_US' : 'sv_SE',
      siteName: 'Fortune Essence',
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'Fortune Essence - Premium Essential Oils',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Fortune Essence',
  url: appUrl,
  logo: `${appUrl}/images/logo.jpg`,
};

const buildWebSiteJsonLd = (locale: 'sv' | 'en') => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Fortune Essence',
  url: appUrl,
  inLanguage: locale === 'sv' ? 'sv-SE' : 'en',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the per-request nonce injected by middleware so we can apply it to
  // inline scripts, satisfying the nonce-based CSP set on each response.
  const nonce = (await headers()).get('x-nonce') ?? '';
  // URL-derived locale, resolved by middleware (FABLE-011). LocaleContext
  // keeps <html lang> in sync on client-side navigations.
  const locale = await getRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Inline script runs synchronously before first paint to apply the saved
            theme class, eliminating the light-mode flash on dark-mode page loads.
            The nonce attribute authorises this script under the nonce-based CSP. */}
        <Script id="theme-init" strategy="beforeInteractive" nonce={nonce}>{`
          (function() {
            try {
              var saved = localStorage.getItem('theme');
              var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (saved === 'dark' || (!saved && prefersDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })();
        `}</Script>
        {/* Site-wide structured data; nonce required by the CSP in middleware. */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteJsonLd(locale)) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen overflow-x-hidden bg-cream-100 dark:bg-[#1a1f1e] text-forest-700 dark:text-[#E8EDE8] transition-colors duration-300`}
      >
        <LocaleProvider>
          <ThemeProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <CookieConsent />
              <Toaster position="top-right" />
              <DevAdminButton />
              <AdvisorProvider>
                <OilAdvisorWidget />
              </AdvisorProvider>
            </AuthProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
