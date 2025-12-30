import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/gdpr/CookieConsent";
import DevAdminButton from "@/components/admin/DevAdminButton";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-cream-100 dark:bg-[#1a1f1e] text-forest-700 dark:text-[#E8EDE8] transition-colors duration-300`}
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
            </AuthProvider>
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
