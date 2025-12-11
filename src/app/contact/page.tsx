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

  const faqs = [
    {
      question: locale === 'sv' ? 'Hur lång är leveranstiden?' : 'What is the delivery time?',
      answer: locale === 'sv' 
        ? 'Vi levererar normalt inom 2-3 arbetsdagar i Sverige med PostNord. Expressfrakt är tillgänglig för leverans nästa dag.'
        : 'We normally deliver within 2-3 business days in Sweden with PostNord. Express shipping is available for next-day delivery.',
    },
    {
      question: locale === 'sv' ? 'Är era produkter ekologiska?' : 'Are your products organic?',
      answer: locale === 'sv' 
        ? 'Alla våra eteriska oljor är 100% naturliga och de flesta är certifierat ekologiska. Vi arbetar endast med pålitliga leverantörer.'
        : 'All our essential oils are 100% natural and most are certified organic. We only work with trusted suppliers.',
    },
    {
      question: locale === 'sv' ? 'Kan jag returnera produkter?' : 'Can I return products?',
      answer: locale === 'sv' 
        ? 'Ja, vi har 30 dagars returrätt på oöppnade produkter. Kontakta vår kundservice för returinstruktioner.'
        : 'Yes, we have a 30-day return policy on unopened products. Contact our customer service for return instructions.',
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
                {locale === 'sv' ? 'Kontakta Oss' : 'Contact Us'}
              </span>
              <span className="block bg-gradient-to-r from-yellow-600 via-purple-600 to-yellow-600 bg-clip-text text-transparent">
                {locale === 'sv' ? 'Vi Hjälper Gärna' : 'We\'re Here to Help'}
              </span>
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              {locale === 'sv' 
                ? 'Har du frågor om våra produkter eller behöver hjälp med din beställning? Tveka inte att höra av dig!'
                : 'Do you have questions about our products or need help with your order? Don\'t hesitate to get in touch!'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <ChatBubbleLeftIcon className="h-8 w-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'sv' ? 'Namn' : 'Name'} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={locale === 'sv' ? 'Ditt namn' : 'Your name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'sv' ? 'E-post' : 'Email'} *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={locale === 'sv' ? 'din@email.se' : 'your@email.com'}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'sv' ? 'Ämne' : 'Subject'} *
                    </label>
                    <select
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {locale === 'sv' ? 'Meddelande' : 'Message'} *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={locale === 'sv' ? 'Skriv ditt meddelande här...' : 'Write your message here...'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {locale === 'sv' ? 'Kontaktuppgifter' : 'Contact Information'}
                </h2>
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <info.icon className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {info.title}
                        </h3>
                        <p className="text-gray-600 whitespace-pre-line">
                          {info.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Online Only Benefits */}
              <div className="bg-gradient-to-br from-purple-50 to-yellow-50 rounded-xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPinIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {locale === 'sv' ? 'Endast Online' : 'Online Only'}
                  </h3>
                  <p className="text-gray-600">
                    {locale === 'sv'
                      ? 'Vi är en digital butik baserad i Göteborg'
                      : 'We are a digital store based in Gothenburg'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700">
                      {locale === 'sv'
                        ? 'Lägre priser tack vare färre omkostnader'
                        : 'Lower prices thanks to reduced overhead costs'
                      }
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700">
                      {locale === 'sv'
                        ? 'Handla när det passar dig, 24/7'
                        : 'Shop whenever it suits you, 24/7'
                      }
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700">
                      {locale === 'sv'
                        ? 'Snabb leverans till hela Sverige'
                        : 'Fast delivery throughout Sweden'
                      }
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="ml-3 text-gray-700">
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

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <QuestionMarkCircleIcon className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">
                {locale === 'sv' ? 'Vanliga Frågor' : 'Frequently Asked Questions'}
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {locale === 'sv' 
                ? 'Här hittar du svar på de vanligaste frågorna. Hittar du inte svaret? Kontakta oss!'
                : 'Here you\'ll find answers to the most common questions. Can\'t find the answer? Contact us!'
              }
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}