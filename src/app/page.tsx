'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { ProductGrid } from '@/components/products/ProductGrid';
import {
  SparklesIcon,
  ShieldCheckIcon,
  TruckIcon,
  HeartIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { InstagramFeed } from '@/components/social/InstagramFeed';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = 'sv'; // This would come from context or props in real app

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products/featured');
        const result = await response.json();
        
        if (result.success) {
          setFeaturedProducts(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const features = [
    {
      icon: SparklesIcon,
      title: locale === 'sv' ? 'Premium Kvalitet' : 'Premium Quality',
      description: locale === 'sv' 
        ? 'Endast de finaste eteriska oljorna från pålitliga leverantörer världen över.'
        : 'Only the finest essential oils from trusted suppliers worldwide.',
    },
    {
      icon: ShieldCheckIcon,
      title: locale === 'sv' ? 'Naturligt & Rent' : 'Natural & Pure',
      description: locale === 'sv' 
        ? 'Inga konstgjorda tillsatser eller kemikalier. 100% naturliga produkter.'
        : 'No artificial additives or chemicals. 100% natural products.',
    },
    {
      icon: TruckIcon,
      title: locale === 'sv' ? 'Snabb Leverans' : 'Fast Delivery',
      description: locale === 'sv'
        ? 'Fri frakt över 500 kr och snabb leverans i hela Sverige.'
        : 'Free shipping over 500 SEK and fast delivery across Sweden.',
    },
  ];

  // TODO: Uncomment when we have real reviews from the database
  // const testimonials = [
  //   {
  //     name: 'Anna Larsson',
  //     rating: 5,
  //     comment: locale === 'sv'
  //       ? 'Fantastiska oljor! Lavendel oljan hjälper mig att sova bättre varje natt.'
  //       : 'Amazing oils! The lavender oil helps me sleep better every night.',
  //     location: 'Stockholm',
  //   },
  //   {
  //     name: 'Erik Svensson',
  //     rating: 5,
  //     comment: locale === 'sv'
  //       ? 'Högsta kvalitet och snabb leverans. Kommer definitivt att beställa igen.'
  //       : 'Highest quality and fast delivery. Will definitely order again.',
  //     location: 'Göteborg',
  //   },
  //   {
  //     name: 'Maria Nilsson',
  //     rating: 5,
  //     comment: locale === 'sv'
  //       ? 'Eucalyptus oljan är perfekt för min diffuser. Rekommenderar varmt!'
  //       : 'The eucalyptus oil is perfect for my diffuser. Highly recommend!',
  //     location: 'Malmö',
  //   },
  // ];


  return (
    <div className="min-h-screen">
      {/* Hero Section - Lifestyle First */}
      <section className="relative overflow-hidden bg-cream-200 py-24 sm:py-32">
        {/* Subtle organic background texture */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--sage-light)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--terracotta-light)_0%,_transparent_50%)]"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content - Left Aligned */}
            <div className="text-left space-y-6">
              <div className="inline-block px-4 py-2 bg-sage-100 text-sage-700 rounded-full text-sm font-medium mb-4">
                ✨ {locale === 'sv' ? 'Naturlig välmående' : 'Natural Wellness'}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-forest-700 leading-tight">
                {locale === 'sv' ? 'Din dagliga dos av lugn' : 'Your daily dose of calm'}
              </h1>

              <p className="text-xl text-forest-600 max-w-lg leading-relaxed">
                {locale === 'sv'
                  ? 'Naturliga eteriska oljor för det moderna livet. Hitta din perfekta doft och skapa ditt eget välmåenderitual.'
                  : 'Natural essential oils for modern life. Find your perfect scent and create your own wellness ritual.'
                }
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-white bg-sage-600 hover:bg-sage-700 transition-all duration-200 shadow-soft hover:shadow-lg hover:-translate-y-0.5 transform"
                >
                  {locale === 'sv' ? 'Hitta din doft' : 'Find Your Scent'}
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-sage-600 text-base font-medium rounded-full text-sage-700 hover:bg-sage-50 transition-all duration-200"
                >
                  {locale === 'sv' ? 'Vår berättelse' : 'Our Story'}
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 pt-6 text-sm text-forest-600">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-sage-600" />
                  <span>{locale === 'sv' ? '100% Naturligt' : '100% Natural'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TruckIcon className="h-5 w-5 text-sage-600" />
                  <span>{locale === 'sv' ? 'Fri frakt över 500kr' : 'Free shipping over 500 SEK'}</span>
                </div>
              </div>
            </div>

            {/* Image - Lifestyle Photography */}
            <div className="relative">
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/hero-lifestyle.png"
                  alt={locale === 'sv' ? 'Ung kvinna i fredlig morgonrutin med eteriska oljor' : 'Young woman in peaceful morning routine with essential oils'}
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    // Fallback gradient
                    (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #A8B5A0 0%, #C17B6B 100%)';
                  }}
                />
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-900/20 to-transparent"></div>
              </div>

              {/* Floating product highlight */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl max-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <p className="text-xs text-forest-600 font-medium">
                      {locale === 'sv' ? 'Mest populär' : 'Best Seller'}
                    </p>
                    <p className="text-sm font-semibold text-forest-800">
                      {locale === 'sv' ? 'Lavendel Olja' : 'Lavender Oil'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Benefits Focused */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-forest-700 mb-4">
              {locale === 'sv' ? 'Varför vi är annorlunda' : 'What makes us different'}
            </h2>
            <p className="text-lg text-forest-600 max-w-2xl mx-auto">
              {locale === 'sv'
                ? 'Bara det bästa för dig och planeten'
                : 'Only the best for you and the planet'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 bg-cream-50 hover:bg-white group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage-100 group-hover:bg-sage-200 transition-colors mb-4">
                  <feature.icon className="h-8 w-8 text-sage-600" />
                </div>
                <h3 className="text-xl font-semibold text-forest-700 mb-3">
                  {feature.title}
                </h3>
                <p className="text-forest-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Featured Products Section */}
      <section className="py-20 bg-cream-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-forest-700 mb-4">
              {locale === 'sv' ? 'Våra favoriter' : 'Our Favorites'}
            </h2>
            <p className="text-lg text-forest-600 max-w-2xl mx-auto">
              {locale === 'sv'
                ? 'De oljor våra kunder älskar mest'
                : 'The oils our customers love most'
              }
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-sage-200 aspect-square rounded-2xl mb-4"></div>
                  <div className="h-4 bg-sage-200 rounded-full mb-2"></div>
                  <div className="h-4 bg-sage-200 rounded-full w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <ProductGrid
              products={featuredProducts}
              locale={locale}
              className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            />
          )}

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center px-8 py-4 border border-transparent text-base font-medium rounded-full text-white bg-sage-600 hover:bg-sage-700 transition-all duration-200 shadow-soft hover:shadow-lg hover:-translate-y-0.5 transform"
            >
              {locale === 'sv' ? 'Se alla produkter' : 'Shop All Products'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* TODO: Uncomment when we have real reviews from the database */}
      {/* Testimonials Section - Instagram Style */}
      {/* <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-forest-700 mb-4">
              {locale === 'sv' ? 'Vad säger de som redan testat?' : 'What are people saying?'}
            </h2>
            <p className="text-lg text-forest-600 max-w-2xl mx-auto">
              {locale === 'sv'
                ? 'Riktiga berättelser från riktiga människor'
                : 'Real stories from real people'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-cream-50 rounded-3xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-terracotta-500 fill-current" />
                  ))}
                </div>
                <blockquote className="text-forest-700 mb-6 text-lg leading-relaxed">
                  "{testimonial.comment}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sage-200 flex items-center justify-center text-sage-700 font-semibold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-forest-800">{testimonial.name}</div>
                    <div className="text-sm text-forest-600">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Instagram Feed */}
      <InstagramFeed locale={locale} />

      {/* Newsletter Section - Commented out for now */}
      {/* <section className="py-20 bg-sage-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-sage-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-terracotta-300 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-serif font-bold text-white mb-4">
              {locale === 'sv' ? 'Välkommen till familjen' : 'Join our community'}
            </h2>
            <p className="text-xl text-sage-100 mb-8">
              {locale === 'sv'
                ? 'Få wellnesstips + 10% rabatt på din första order'
                : 'Get wellness tips + 10% off your first order'
              }
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={locale === 'sv' ? 'Din e-postadress' : 'Your email address'}
                className="flex-1 px-6 py-4 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-terracotta-500 text-forest-700"
                required
              />
              <button
                type="submit"
                className="px-8 py-4 bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold rounded-full transition-all duration-200 whitespace-nowrap shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
              >
                {locale === 'sv' ? 'Jag är med!' : "I'm in!"}
              </button>
            </form>
            <p className="text-sm text-sage-200 mt-4">
              {locale === 'sv'
                ? 'Inga spam, bara goda vibbar. Avsluta när du vill. 💚'
                : 'No spam, just good vibes. Unsubscribe anytime. 💚'
              }
            </p>
          </div>
        </div>
      </section> */}
    </div>
  );
}