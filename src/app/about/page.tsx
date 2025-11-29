'use client';

import Link from 'next/link';
import { 
  HeartIcon, 
  ShieldCheckIcon, 
  SparklesIcon, 
  GlobeAltIcon,
  UserGroupIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

export default function AboutPage() {
  const locale = 'sv'; // This would come from context in a real app

  const values = [
    {
      icon: SparklesIcon,
      title: locale === 'sv' ? 'Premium Kvalitet' : 'Premium Quality',
      description: locale === 'sv' 
        ? 'Vi använder endast de finaste eteriska oljorna från pålitliga leverantörer världen över.'
        : 'We use only the finest essential oils from trusted suppliers worldwide.',
    },
    {
      icon: ShieldCheckIcon,
      title: locale === 'sv' ? 'Naturligt & Rent' : 'Natural & Pure',
      description: locale === 'sv' 
        ? 'Inga konstgjorda tillsatser eller kemikalier. 100% naturliga produkter.'
        : 'No artificial additives or chemicals. 100% natural products.',
    },
    {
      icon: HeartIcon,
      title: locale === 'sv' ? 'Etiskt Ansvar' : 'Ethical Responsibility',
      description: locale === 'sv' 
        ? 'Vi stödjer hållbara metoder och rättvis handel med våra partners.'
        : 'We support sustainable practices and fair trade with our partners.',
    },
    {
      icon: GlobeAltIcon,
      title: locale === 'sv' ? 'Globalt Nätverk' : 'Global Network',
      description: locale === 'sv' 
        ? 'Våra produkter kommer från de bästa odlingsområdena runt om i världen.'
        : 'Our products come from the finest growing regions around the world.',
    },
  ];

  const team = [
    {
      name: 'Emma Larsson',
      role: locale === 'sv' ? 'Grundare & VD' : 'Founder & CEO',
      description: locale === 'sv' 
        ? '15 års erfarenhet inom aromaterapi och naturliga hälsoprodukter.'
        : '15 years of experience in aromatherapy and natural health products.',
      image: '/images/team/emma.jpg',
    },
    {
      name: 'Marcus Andersson',
      role: locale === 'sv' ? 'Produktchef' : 'Product Manager',
      description: locale === 'sv' 
        ? 'Expert på kvalitetskontroll och leverantörsrelationer.'
        : 'Expert in quality control and supplier relationships.',
      image: '/images/team/marcus.jpg',
    },
    {
      name: 'Sofia Nilsson',
      role: locale === 'sv' ? 'Aromaterapeut' : 'Aromatherapist',
      description: locale === 'sv' 
        ? 'Certifierad aromaterapeut med fokus på hållbarhet.'
        : 'Certified aromatherapist with a focus on sustainability.',
      image: '/images/team/sofia.jpg',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-100 via-purple-50 to-yellow-50 py-20">
        <div className="absolute inset-0 bg-[url('/images/patterns/oil-drops.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="block">
                {locale === 'sv' ? 'Om Fortune Essence' : 'About Fortune Essence'}
              </span>
              <span className="block bg-gradient-to-r from-yellow-600 via-purple-600 to-yellow-600 bg-clip-text text-transparent">
                {locale === 'sv' ? 'Vår Berättelse' : 'Our Story'}
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              {locale === 'sv' 
                ? 'Fortune Essence grundades 2020 med en vision att dela kraften i naturens eteriska oljor med människor över hela Sverige. Vi tror på kvalitet, hållbarhet och den transformerande kraften av aromaterapi.'
                : 'Fortune Essence was founded in 2020 with a vision to share the power of nature\'s essential oils with people across Sweden. We believe in quality, sustainability, and the transformative power of aromatherapy.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {locale === 'sv' ? 'Vår Resa' : 'Our Journey'}
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  {locale === 'sv' 
                    ? 'Det började med en passion för naturens läkande kraft. Grundaren Emma Larsson upptäckte aromaterapi under sina resor genom Provence och Grekland, där hon lärde sig traditionella metoder för att extrahera och använda eteriska oljor.'
                    : 'It started with a passion for nature\'s healing power. Founder Emma Larsson discovered aromatherapy during her travels through Provence and Greece, where she learned traditional methods for extracting and using essential oils.'
                  }
                </p>
                <p>
                  {locale === 'sv' 
                    ? 'Tillbaka i Sverige insåg hon att det fanns ett gap på marknaden för verkligt högkvalitativa, etiskt producerade eteriska oljor. Fortune Essence föddes ur denna vision - att göra de bästa naturprodukterna tillgängliga för alla svenskar.'
                    : 'Back in Sweden, she realized there was a gap in the market for truly high-quality, ethically produced essential oils. Fortune Essence was born from this vision - to make the best natural products available to all Swedes.'
                  }
                </p>
                <p>
                  {locale === 'sv' 
                    ? 'Idag arbetar vi med över 20 leverantörer världen över, från lavendelfält i Provence till eukalyptusplantager i Australien, för att säkerställa att varje droppe olja lever upp till våra höga standarder.'
                    : 'Today we work with over 20 suppliers worldwide, from lavender fields in Provence to eucalyptus plantations in Australia, to ensure that every drop of oil meets our high standards.'
                  }
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-yellow-200 to-purple-200 p-8 shadow-xl">
                <div className="w-full h-full bg-white rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <GlobeAltIcon className="h-24 w-24 mx-auto mb-4 text-purple-400" />
                    <p className="text-sm">
                      {locale === 'sv' ? 'Vår globala närvaro' : 'Our global presence'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {locale === 'sv' ? 'Våra Värderingar' : 'Our Values'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {locale === 'sv' 
                ? 'Dessa principer styr allt vi gör och varje beslut vi tar.'
                : 'These principles guide everything we do and every decision we make.'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-yellow-100 mb-4">
                  <value.icon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {locale === 'sv' ? 'Vårt Team' : 'Our Team'}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {locale === 'sv' 
                ? 'Möt de passionerade människorna bakom Fortune Essence.'
                : 'Meet the passionate people behind Fortune Essence.'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-200 to-yellow-200 mx-auto mb-6 flex items-center justify-center">
                  <UserGroupIcon className="h-16 w-16 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-purple-600 font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-gray-600">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {locale === 'sv' ? 'Redo att börja din resa?' : 'Ready to start your journey?'}
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            {locale === 'sv' 
              ? 'Upptäck våra handplockade eteriska oljor och upplev skillnaden i kvalitet.'
              : 'Discover our hand-picked essential oils and experience the difference in quality.'
            }
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-purple-600 bg-white hover:bg-gray-100 transition-colors duration-200"
          >
            {locale === 'sv' ? 'Se Produkter' : 'Shop Now'}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}