import Link from 'next/link';
import { ArrowLeftIcon, HomeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  const locale = 'sv'; // Would come from context in real app

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Visual */}
        <div className="mb-8">
          <h1 className="text-9xl font-serif font-bold text-forest-800 mb-4">404</h1>
          <div className="w-24 h-1 bg-sage-600 mx-auto rounded-full mb-6" />
        </div>

        {/* Message */}
        <h2 className="text-3xl lg:text-4xl font-serif font-bold text-forest-800 mb-4">
          {locale === 'sv' ? 'Sidan hittades inte' : 'Page Not Found'}
        </h2>
        <p className="text-lg text-forest-600 mb-8 max-w-md mx-auto">
          {locale === 'sv'
            ? 'Sidan du letar efter finns inte eller har flyttats. Låt oss hjälpa dig hitta rätt.'
            : "The page you're looking for doesn't exist or has been moved. Let us help you find your way."
          }
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
          >
            <HomeIcon className="h-5 w-5" />
            {locale === 'sv' ? 'Tillbaka till startsidan' : 'Back to Home'}
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-forest-800 font-semibold border-2 border-cream-300 hover:border-sage-600 hover:bg-sage-50 transition-all shadow-lg"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            {locale === 'sv' ? 'Utforska produkter' : 'Explore Products'}
          </Link>
        </div>

        {/* Popular Links */}
        <div className="bg-white rounded-3xl shadow-soft p-8">
          <h3 className="font-semibold text-forest-800 mb-4">
            {locale === 'sv' ? 'Populära sidor' : 'Popular Pages'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/products?category=essential-oils"
              className="text-sage-700 hover:text-sage-800 hover:underline transition-colors"
            >
              {locale === 'sv' ? 'Eteriska oljor' : 'Essential Oils'}
            </Link>
            <Link
              href="/products?category=diffusers"
              className="text-sage-700 hover:text-sage-800 hover:underline transition-colors"
            >
              {locale === 'sv' ? 'Diffusers' : 'Diffusers'}
            </Link>
            <Link
              href="/contact"
              className="text-sage-700 hover:text-sage-800 hover:underline transition-colors"
            >
              {locale === 'sv' ? 'Kontakt' : 'Contact'}
            </Link>
            <Link
              href="/about"
              className="text-sage-700 hover:text-sage-800 hover:underline transition-colors"
            >
              {locale === 'sv' ? 'Om oss' : 'About Us'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
