'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FooterProps {
  locale?: 'sv' | 'en';
}

export const Footer = ({ locale = 'sv' }: FooterProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error(locale === 'sv' ? 'Ange en giltig e-postadress' : 'Please enter a valid email');
      return;
    }

    setIsSubmitting(true);
    try {
      // This would integrate with the newsletter API when implemented
      // await fetch('/api/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
      toast.success(
        locale === 'sv'
          ? 'Tack för din prenumeration!'
          : 'Thank you for subscribing!'
      );
      setEmail('');
    } catch (error) {
      toast.error(locale === 'sv' ? 'Något gick fel' : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: {
      title: locale === 'sv' ? 'Handla' : 'Shop',
      links: [
        { label: locale === 'sv' ? 'Alla produkter' : 'All Products', href: '/products' },
        { label: locale === 'sv' ? 'Eteriska oljor' : 'Essential Oils', href: '/products?category=essential-oils' },
      ]
    },
    account: {
      title: locale === 'sv' ? 'Mitt konto' : 'My Account',
      links: [
        { label: locale === 'sv' ? 'Logga in' : 'Sign In', href: '/auth/signin' },
        { label: locale === 'sv' ? 'Skapa konto' : 'Create Account', href: '/auth/signup' },
        { label: locale === 'sv' ? 'Mina beställningar' : 'My Orders', href: '/account/orders' },
        { label: locale === 'sv' ? 'Önskelista' : 'Wishlist', href: '/wishlist' },
        { label: locale === 'sv' ? 'Spåra order' : 'Track Order', href: '/orders/track' },
      ]
    },
    support: {
      title: locale === 'sv' ? 'Kundservice' : 'Customer Support',
      links: [
        { label: locale === 'sv' ? 'Kontakta oss' : 'Contact Us', href: '/contact' },
        { label: locale === 'sv' ? 'Vanliga frågor' : 'FAQ', href: '/faq' },
        { label: locale === 'sv' ? 'Frakt & Leverans' : 'Shipping & Delivery', href: '/shipping-policy' },
        { label: locale === 'sv' ? 'Returer' : 'Returns', href: '/refund' },
      ]
    }
  };

  return (
    <footer className="bg-cream-100 dark:bg-[#1a1f1e] mt-auto border-t border-forest-200 dark:border-gray-800">
      {/* Newsletter Section - Commented out for now */}
      {/* <div className="border-b border-forest-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl lg:text-3xl font-serif font-bold mb-3">
              {locale === 'sv' ? 'Få exklusiva erbjudanden' : 'Get Exclusive Offers'}
            </h3>
            <p className="text-forest-300 mb-6">
              {locale === 'sv'
                ? 'Prenumerera på vårt nyhetsbrev och få 10% rabatt på din första beställning'
                : 'Subscribe to our newsletter and get 10% off your first order'
              }
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={locale === 'sv' ? 'Din e-postadress' : 'Your email address'}
                className="flex-1 px-6 py-3.5 rounded-full bg-white/10 border border-forest-600 text-white placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? (locale === 'sv' ? 'Skickar...' : 'Sending...')
                  : (locale === 'sv' ? 'Prenumerera' : 'Subscribe')
                }
              </button>
            </form>
          </div>
        </div>
      </div> */}

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-serif font-bold text-forest-900 dark:text-[#F0F5F0]">
                Fortune Essence
              </span>
            </Link>
            <p className="text-forest-700 dark:text-[#C5D4C5] text-sm leading-relaxed mb-6">
              {locale === 'sv'
                ? 'Upptäck naturens väsentlighet genom våra eteriska oljor och aromaterapi-produkter av högsta kvalitet.'
                : 'Discover the essence of nature through our premium essential oils and aromatherapy products.'
              }
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-forest-100 dark:bg-white/10 border border-forest-300 dark:border-forest-600 flex items-center justify-center hover:bg-sage-600 hover:border-sage-600 transition-all text-forest-700 dark:text-white"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-forest-100 dark:bg-white/10 border border-forest-300 dark:border-forest-600 flex items-center justify-center hover:bg-sage-600 hover:border-sage-600 transition-all text-forest-700 dark:text-white"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-forest-100 dark:bg-white/10 border border-forest-300 dark:border-forest-600 flex items-center justify-center hover:bg-sage-600 hover:border-sage-600 transition-all text-forest-700 dark:text-white"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section, index) => (
            <div key={index}>
              <h4 className="text-forest-900 dark:text-[#F0F5F0] font-semibold text-lg mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-forest-700 dark:text-[#C5D4C5] hover:text-sage-600 dark:hover:text-sage-300 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Information */}
        <div className="mt-12 pt-8 border-t border-forest-200 dark:border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <EnvelopeIcon className="h-6 w-6 text-sage-600 dark:text-sage-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-forest-900 dark:text-[#F0F5F0] mb-1">
                  {locale === 'sv' ? 'E-post' : 'Email'}
                </p>
                <a href="mailto:info@fortuneessence.se" className="text-forest-700 dark:text-[#C5D4C5] hover:text-sage-600 dark:hover:text-sage-300 transition-colors text-sm">
                  info@fortuneessence.se
                </a>
              </div>
            </div>
            {/* Phone section commented out - no company phone yet */}
            {/* <div className="flex items-start gap-3">
              <PhoneIcon className="h-6 w-6 text-sage-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-white mb-1">
                  {locale === 'sv' ? 'Telefon' : 'Phone'}
                </p>
                <a href="tel:+46123456789" className="text-forest-300 hover:text-sage-400 transition-colors text-sm">
                  +46 12 345 67 89
                </a>
              </div>
            </div> */}
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-6 w-6 text-sage-600 dark:text-sage-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-forest-900 dark:text-[#F0F5F0] mb-1">
                  {locale === 'sv' ? 'Adress' : 'Address'}
                </p>
                <p className="text-forest-700 dark:text-[#C5D4C5] text-sm">
                  Göteborg, Sverige
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods & Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-forest-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-forest-600 dark:text-[#8A9A8A] text-sm">
              © {currentYear} Fortune Essence. {locale === 'sv' ? 'Alla rättigheter förbehållna.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-forest-600 dark:text-[#8A9A8A] text-sm">
                {locale === 'sv' ? 'Vi accepterar:' : 'We accept:'}
              </span>
              <div className="flex gap-2">
                {/* Payment method badges */}
                <div className="px-3 py-1.5 bg-white rounded text-xs font-semibold text-forest-800">
                  Swish
                </div>
                <div className="px-3 py-1.5 bg-white rounded text-xs font-semibold text-forest-800">
                  Klarna
                </div>
                <div className="px-3 py-1.5 bg-white rounded text-xs font-semibold text-forest-800">
                  Visa
                </div>
                <div className="px-3 py-1.5 bg-white rounded text-xs font-semibold text-forest-800">
                  Mastercard
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
