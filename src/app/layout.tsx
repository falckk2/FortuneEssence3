import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
  openGraph: {
    title: "Fortune Essence - Premium Essential Oils",
    description: "Discover premium essential oils and aromatherapy products. Natural, organic, and ethically sourced.",
    type: "website",
    locale: "sv_SE",
    alternateLocale: "en_US",
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
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-cream-100`}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header locale="sv" />
            <main className="flex-1">
              {children}
            </main>
            <Footer locale="sv" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
