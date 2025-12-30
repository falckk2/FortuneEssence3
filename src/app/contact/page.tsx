'use client';

import { useState } from 'react';
import { 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  ClockIcon,
  ChatBubbleLeftIcon,
  QuestionMarkCircleIcon 
} from '@heroicons/react/24/outline';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const locale = 'sv'; // This would come from context in a real app

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitted(true);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: MapPinIcon,
      title: locale === 'sv' ? 'Plats' : 'Location',
      content: locale === 'sv'
        ? 'Göteborg, Sverige\n(Endast online)'
        : 'Gothenburg, Sweden\n(Online only)',
    },
    // Phone section commented out - no company phone yet
    // {
    //   icon: PhoneIcon,
    //   title: locale === 'sv' ? 'Telefon' : 'Phone',
    //   content: '+46 31 123 456 78',
    // },
    {
      icon: EnvelopeIcon,
      title: locale === 'sv' ? 'E-post' : 'Email',
      content: 'info@fortune-essence.se',
    },
    {
      icon: ClockIcon,
      title: locale === 'sv' ? 'Kundservice' : 'Customer Service',
      content: locale === 'sv'
        ? 'Mån-Fre: 9:00-17:00\nSvarar på e-post inom 24h'
        : 'Mon-Fri: 9:00-17:00\nEmail replies within 24h',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-100 via-purple-50 to-yellow-50 dark:from-[#2a3330] dark:via-[#1a1f1e] dark:to-[#242a28] py-20">
        <div className="absolute inset-0 bg-[url('/images/patterns/oil-drops.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-[#E8EDE8] mb-6">
              <span className="block">
                {locale === 'sv' ? 'Kontakta Oss' : 'Contact Us'}
              </span>
              <span className="block bg-gradient-to-r from-yellow-600 via-purple-600 to-yellow-600 dark:from-sage-400 dark:via-sage-300 dark:to-sage-400 bg-clip-text text-transparent">
                {locale === 'sv' ? 'Vi Hjälper Gärna' : 'We\'re Here to Help'}
              </span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-[#B8C5B8] mb-8">
              {locale === 'sv' 
                ? 'Har du frågor om våra produkter eller behöver hjälp med din beställning? Tveka inte att höra av dig!'
                : 'Do you have questions about our products or need help with your order? Don\'t hesitate to get in touch!'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-20 bg-white dark:bg-[#1a1f1e]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 dark:bg-[#2a3330] rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <ChatBubbleLeftIcon className="h-8 w-8 text-purple-600 dark:text-sage-400 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8EDE8]">
                  {locale === 'sv' ? 'Skicka ett Meddelande' : 'Send us a Message'}
                </h2>
              </div>

              {submitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-green-600 text-4xl mb-4">✓</div>
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    {locale === 'sv' ? 'Tack för ditt meddelande!' : 'Thank you for your message!'}
                  </h3>
                  <p className="text-green-700">
                    {locale === 'sv' 
                      ? 'Vi återkommer till dig inom 24 timmar.'
                      : 'We\'ll get back to you within 24 hours.'
                    }
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#B8C5B8] mb-2">
                        {locale === 'sv' ? 'Namn' : 'Name'} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-sage-600 focus:border-transparent bg-white dark:bg-[#343c39] text-gray-900 dark:text-[#E8EDE8]"
                        placeholder={locale === 'sv' ? 'Ditt namn' : 'Your name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-[#B8C5B8] mb-2">
                        {locale === 'sv' ? 'E-post' : 'Email'} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-sage-600 focus:border-transparent bg-white dark:bg-[#343c39] text-gray-900 dark:text-[#E8EDE8]"
                        placeholder={locale === 'sv' ? 'din@email.se' : 'your@email.com'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#B8C5B8] mb-2">
                      {locale === 'sv' ? 'Ämne' : 'Subject'} *
                    </label>
                    <select
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-sage-600 focus:border-transparent bg-white dark:bg-[#343c39] text-gray-900 dark:text-[#E8EDE8]"
                    >
                      <option value="">
                        {locale === 'sv' ? 'Välj ämne' : 'Choose subject'}
                      </option>
                      <option value="product">
                        {locale === 'sv' ? 'Produktfråga' : 'Product Question'}
                      </option>
                      <option value="order">
                        {locale === 'sv' ? 'Beställningsfråga' : 'Order Question'}
                      </option>
                      <option value="shipping">
                        {locale === 'sv' ? 'Leveransfråga' : 'Shipping Question'}
                      </option>
                      <option value="return">
                        {locale === 'sv' ? 'Retur/Reklamation' : 'Return/Complaint'}
                      </option>
                      <option value="other">
                        {locale === 'sv' ? 'Annat' : 'Other'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#B8C5B8] mb-2">
                      {locale === 'sv' ? 'Meddelande' : 'Message'} *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-sage-600 focus:border-transparent bg-white dark:bg-[#343c39] text-gray-900 dark:text-[#E8EDE8]"
                      placeholder={locale === 'sv' ? 'Skriv ditt meddelande här...' : 'Write your message here...'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-sage-700 dark:to-sage-800 text-white dark:text-[#E8EDE8] font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 dark:hover:from-sage-800 dark:hover:to-sage-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting 
                      ? (locale === 'sv' ? 'Skickar...' : 'Sending...')
                      : (locale === 'sv' ? 'Skicka Meddelande' : 'Send Message')
                    }
                  </button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8EDE8] mb-6">
                  {locale === 'sv' ? 'Kontaktuppgifter' : 'Contact Information'}
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-[#3f4946] rounded-lg flex items-center justify-center">
                          <info.icon className="h-6 w-6 text-purple-600 dark:text-sage-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-[#E8EDE8] mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-600 dark:text-[#B8C5B8] whitespace-pre-line">
                          {info.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Online Only Benefits */}
              <div className="bg-gradient-to-br from-purple-50 to-yellow-50 dark:from-[#2a3330] dark:to-[#343c39] rounded-xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-[#3f4946] rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPinIcon className="h-8 w-8 text-purple-600 dark:text-sage-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-[#E8EDE8] mb-2">
                    {locale === 'sv' ? 'Endast Online' : 'Online Only'}
                  </h3>
                  <p className="text-gray-600 dark:text-[#B8C5B8]">
                    {locale === 'sv'
                      ? 'Vi är en digital butik baserad i Göteborg'
                      : 'We are a digital store based in Gothenburg'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 dark:bg-sage-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white dark:text-[#E8EDE8] text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700 dark:text-[#B8C5B8]">
                      {locale === 'sv'
                        ? 'Lägre priser tack vare färre omkostnader'
                        : 'Lower prices thanks to reduced overhead costs'
                      }
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 dark:bg-sage-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white dark:text-[#E8EDE8] text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700 dark:text-[#B8C5B8]">
                      {locale === 'sv'
                        ? 'Handla när det passar dig, 24/7'
                        : 'Shop whenever it suits you, 24/7'
                      }
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 dark:bg-sage-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white dark:text-[#E8EDE8] text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700 dark:text-[#B8C5B8]">
                      {locale === 'sv'
                        ? 'Snabb leverans till hela Sverige'
                        : 'Fast delivery throughout Sweden'
                      }
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 dark:bg-sage-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white dark:text-[#E8EDE8] text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700 dark:text-[#B8C5B8]">
                      {locale === 'sv'
                        ? 'Hållbart och miljövänligt utan fysisk butik'
                        : 'Sustainable and eco-friendly without physical store'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Link Section */}
      <section className="py-20 bg-gray-50 dark:bg-[#242a28]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-yellow-50 dark:from-[#2a3330] dark:to-[#343c39] rounded-2xl p-12 text-center">
              <div className="flex items-center justify-center mb-6">
                <QuestionMarkCircleIcon className="h-12 w-12 text-purple-600 dark:text-sage-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-[#E8EDE8] mb-4">
                {locale === 'sv' ? 'Har du frågor?' : 'Have Questions?'}
              </h2>
              <p className="text-lg text-gray-600 dark:text-[#B8C5B8] mb-8 max-w-2xl mx-auto">
                {locale === 'sv'
                  ? 'Besök vår FAQ-sida för svar på vanliga frågor om våra produkter, leverans, returer och mycket mer.'
                  : 'Visit our FAQ page for answers to common questions about our products, delivery, returns and more.'
                }
              </p>
              <a
                href="/faq"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-sage-700 dark:to-sage-800 text-white dark:text-[#E8EDE8] font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 dark:hover:from-sage-800 dark:hover:to-sage-900 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                {locale === 'sv' ? 'Besök FAQ-sidan' : 'Visit FAQ Page'}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}