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

const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: "Fortune Essence - Premium Essential Oils",
  description: "Discover premium essential oils and aromatherapy products. Natural, organic, and ethically sourced from Fortune Essence.",
  keywords: "essential oils, aromatherapy, lavender, organic oils, natural wellness, Sweden",
  authors: [{ name: "Fortune Essence" }],
  robots: "index, follow",
  icons: {
    icon: '/images/logo.jpg',
    apple: '/images/logo.jpg',
  },
  openGraph: {
    title: "Fortune Essence - Premium Essential Oils",
    description: "Discover premium essential oils and aromatherapy products. Natural, organic, and ethically sourced.",
    type: "website",
    locale: "sv_SE",
    alternateLocale: "en_US",
    images: [
      {
        url: '/images/logo.jpg',
        width: 800,
        height: 800,
        alt: 'Fortune Essence Logo',
      },
    ],
  },
};

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

  return (
    <html lang="sv" suppressHydrationWarning>
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
