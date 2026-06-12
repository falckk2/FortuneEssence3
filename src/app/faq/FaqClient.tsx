'use client';

import { useState } from 'react';
import Link from '@/components/i18n/Link';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  TruckIcon,
  CreditCardIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { useLocale } from '@/contexts/LocaleContext';
import { faqData, faqCategories, type FAQCategory } from '@/data/faq';

const categoryIcons: Record<FAQCategory | 'all', typeof QuestionMarkCircleIcon> = {
  all: QuestionMarkCircleIcon,
  order: ShoppingBagIcon,
  shipping: TruckIcon,
  payment: CreditCardIcon,
  returns: ArrowPathIcon,
  products: QuestionMarkCircleIcon,
  other: EnvelopeIcon,
};

export default function FaqClient() {
  const { locale } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'all'>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !searchQuery ||
      item.question[locale].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer[locale].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-[#1a1f1e]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sage-600 to-forest-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              {locale === 'sv' ? 'Vanliga frågor' : 'Frequently asked questions'}
            </h1>
            <p className="text-xl text-cream-100 mb-8">
              {locale === 'sv'
                ? 'Hitta svar på dina frågor om beställningar, frakt, och våra produkter'
                : 'Find answers to your questions about orders, shipping and our products'}
            </p>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
              <input
                type="text"
                placeholder={locale === 'sv' ? 'Sök efter frågor...' : 'Search questions...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-forest-800 dark:bg-[#242a28] dark:text-[#E8EDE8] dark:placeholder-[#8A9A8A] focus:outline-none focus:ring-4 focus:ring-sage-300 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {faqCategories.map((category) => {
                const Icon = categoryIcons[category.id];
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                      activeCategory === category.id
                        ? 'bg-sage-600 text-white shadow-lg'
                        : 'bg-white text-forest-700 hover:bg-sage-50 shadow-soft dark:bg-[#242a28] dark:text-[#C5D4C5] dark:hover:bg-[#2a3330]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {category.name[locale]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden transition-all hover:shadow-lg"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors"
                  >
                    <span className="font-semibold text-forest-800 dark:text-[#E8EDE8] pr-4">
                      {item.question[locale]}
                    </span>
                    <ChevronDownIcon
                      className={`h-5 w-5 text-forest-600 dark:text-[#8A9A8A] flex-shrink-0 transition-transform ${
                        openItems.has(item.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openItems.has(item.id) && (
                    <div className="px-6 pb-5 text-forest-700 dark:text-[#B8C5B8] leading-relaxed border-t border-cream-200 dark:border-[#3f4946] pt-4">
                      {item.answer[locale]}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4 text-forest-300 dark:text-[#6B7B6B]" />
                <p className="text-forest-600 dark:text-[#C5D4C5] text-lg mb-2">
                  {locale === 'sv' ? 'Inga frågor hittades' : 'No questions found'}
                </p>
                <p className="text-forest-500 dark:text-[#8A9A8A]">
                  {locale === 'sv'
                    ? 'Försök med andra sökord eller kategorier'
                    : 'Try different search terms or categories'}
                </p>
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-gradient-to-br from-sage-50 to-cream-100 dark:from-[#242a28] dark:to-[#2a3330] rounded-2xl p-8 text-center border-2 border-sage-200 dark:border-[#3f4946]">
            <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 text-sage-600 dark:text-[#8A9A8A]" />
            <h2 className="text-2xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-2">
              {locale === 'sv' ? 'Hittade du inte svaret?' : "Didn't find your answer?"}
            </h2>
            <p className="text-forest-700 dark:text-[#B8C5B8] mb-6">
              {locale === 'sv'
                ? 'Vår kundservice hjälper dig gärna! Vi svarar normalt inom 24 timmar.'
                : 'Our customer service is happy to help! We normally reply within 24 hours.'}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
              >
                <EnvelopeIcon className="h-5 w-5" />
                {locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
              </Link>
              <a
                href="mailto:support@fortuneessence.se"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-sage-700 font-semibold hover:bg-sage-50 transition-all shadow-soft hover:shadow-lg border-2 border-sage-200 dark:bg-[#242a28] dark:text-[#C5D4C5] dark:hover:bg-[#2a3330] dark:border-[#3f4946]"
              >
                support@fortuneessence.se
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
