'use client';

import { useState } from 'react';
import Link from 'next/link';
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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'order' | 'shipping' | 'payment' | 'returns' | 'products' | 'other';
}

const faqData: FAQItem[] = [
  // Orders
  {
    id: 'order-1',
    question: 'Hur lägger jag en beställning?',
    answer: 'För att lägga en beställning, bläddra bland våra produkter, lägg de önskade produkterna i varukorgen och följ kassaprocessen. Du behöver skapa ett konto eller logga in för att slutföra ditt köp.',
    category: 'order',
  },
  {
    id: 'order-2',
    question: 'Kan jag ändra eller avbryta min beställning?',
    answer: 'Du kan ändra eller avbryta din beställning inom 2 timmar efter att den har lagts. Kontakta vår kundservice omedelbart på support@fortuneessence.se eller via kontaktformuläret. Efter detta börjar vi bearbeta din beställning och ändringar kan inte längre göras.',
    category: 'order',
  },
  {
    id: 'order-3',
    question: 'Får jag en orderbekräftelse?',
    answer: 'Ja, du kommer att få en bekräftelse via e-post så snart din beställning har lagts. Om du inte får ett e-postmeddelande inom 10 minuter, kontrollera din skräppostmapp eller kontakta vår kundservice.',
    category: 'order',
  },
  {
    id: 'order-4',
    question: 'Hur spårar jag min beställning?',
    answer: 'När din beställning har skickats får du ett e-postmeddelande med ett spårningsnummer. Du kan också logga in på ditt konto och besöka "Mina beställningar" för att se statusen på alla dina beställningar och spårningsinformation.',
    category: 'order',
  },

  // Shipping
  {
    id: 'shipping-1',
    question: 'Vilka fraktalternativ erbjuder ni?',
    answer: 'Vi erbjuder flera fraktalternativ: PostNord Standard (3-4 arbetsdagar, 49 kr), PostNord Paket (2-3 arbetsdagar, 69 kr), och PostNord Express (1-2 arbetsdagar, 129 kr). Vi erbjuder också DHL och Bring för internationella leveranser.',
    category: 'shipping',
  },
  {
    id: 'shipping-2',
    question: 'Är frakten gratis?',
    answer: 'Ja, vi erbjuder gratis frakt på alla beställningar över 500 kr inom Sverige. För beställningar under 500 kr tillkommer fraktkostnaden beroende på vilket fraktalternativ du väljer.',
    category: 'shipping',
  },
  {
    id: 'shipping-3',
    question: 'Hur lång tid tar leveransen?',
    answer: 'Leveranstiden beror på vilket fraktalternativ du väljer. PostNord Standard tar 3-4 arbetsdagar, PostNord Paket tar 2-3 arbetsdagar, och PostNord Express tar 1-2 arbetsdagar. Beställningar som läggs före kl. 14:00 på vardagar skickas normalt samma dag.',
    category: 'shipping',
  },
  {
    id: 'shipping-4',
    question: 'Levererar ni internationellt?',
    answer: 'Ja, vi levererar till hela EU och Norge. Fraktkostnaden beräknas i kassan baserat på destinationen. Internationella leveranser tar vanligtvis 5-10 arbetsdagar. Observera att tullavgifter och importskatter kan tillkomma för beställningar utanför EU.',
    category: 'shipping',
  },

  // Payment
  {
    id: 'payment-1',
    question: 'Vilka betalningsmetoder accepterar ni?',
    answer: 'Vi accepterar Swish, Klarna (faktura och delbetalning), kreditkort (Visa, Mastercard, American Express) via Stripe, och banköverföring. Alla betalningar är säkra och krypterade.',
    category: 'payment',
  },
  {
    id: 'payment-2',
    question: 'Är det säkert att handla hos er?',
    answer: 'Ja, absolut. Vi använder SSL-kryptering för alla transaktioner och lagrar aldrig dina kortuppgifter. Våra betalningar hanteras av säkra betalningsleverantörer som Stripe och Klarna. Vi följer också GDPR-regler för att skydda din personliga information.',
    category: 'payment',
  },
  {
    id: 'payment-3',
    question: 'Kan jag betala med faktura?',
    answer: 'Ja, genom Klarna kan du välja att betala med faktura. Du får då 14 dagar på dig att betala efter att du mottagit din beställning. Detta alternativ är tillgängligt för kunder i Sverige.',
    category: 'payment',
  },
  {
    id: 'payment-4',
    question: 'Varför avvisades min betalning?',
    answer: 'Betalningar kan avvisas av flera anledningar: otillräckliga medel, felaktiga kortuppgifter, säkerhetsrestriktioner från din bank, eller överskriden kreditgräns. Kontakta din bank för mer information eller prova en annan betalningsmetod.',
    category: 'payment',
  },

  // Returns
  {
    id: 'returns-1',
    question: 'Vad är er returpolicy?',
    answer: 'Vi erbjuder 14 dagars öppet köp från det att du mottagit din beställning. Produkterna måste vara oöppnade och i originalförpackning. Hygienartiklar och öppnade produkter kan inte returneras av hälso- och säkerhetsskäl.',
    category: 'returns',
  },
  {
    id: 'returns-2',
    question: 'Hur returnerar jag en produkt?',
    answer: 'Logga in på ditt konto, gå till "Mina beställningar", välj den beställning du vill returnera och klicka på "Begär retur". Följ instruktionerna för att skriva ut en retursedel. Skicka tillbaka paketet till den adress som anges. När vi mottagit returen kommer vi att behandla din återbetalning inom 5-10 arbetsdagar.',
    category: 'returns',
  },
  {
    id: 'returns-3',
    question: 'Vem betalar returfrakten?',
    answer: 'Om du returnerar en produkt på grund av ångerrätt står du för returfrakten. Om produkten är defekt eller om vi har skickat fel vara står vi för returfrakten. Kontakta vår kundservice i dessa fall innan du returnerar varan.',
    category: 'returns',
  },
  {
    id: 'returns-4',
    question: 'När får jag tillbaka mina pengar?',
    answer: 'När vi har mottagit och godkänt din retur bearbetas återbetalningen inom 5-10 arbetsdagar. Pengarna återbetalas till samma betalningsmetod som användes vid köpet. Det kan ta ytterligare 3-5 arbetsdagar innan pengarna syns på ditt konto beroende på din bank.',
    category: 'returns',
  },

  // Products
  {
    id: 'products-1',
    question: 'Är era eteriska oljor rena och naturliga?',
    answer: 'Ja, alla våra eteriska oljor är 100% rena, naturliga och terapeutiska. Vi använder inga syntetiska tillsatser, fyllmedel eller utspädningsmedel. Varje produkt kommer med analysrapporter och certifikat som bekräftar äktheten.',
    category: 'products',
  },
  {
    id: 'products-2',
    question: 'Hur ska jag förvara mina eteriska oljor?',
    answer: 'Förvara dina eteriska oljor i en sval, mörk plats borta från direkt solljus och värmekällor. Håll flaskorna väl förslutna när de inte används. Vid korrekt förvaring håller de flesta eteriska oljor i 2-3 år, citrusoljor i ca 1-2 år.',
    category: 'products',
  },
  {
    id: 'products-3',
    question: 'Kan jag använda eteriska oljor direkt på huden?',
    answer: 'De flesta eteriska oljor bör spädas ut med en bärarolja innan de appliceras på huden. Vissa milda oljor som lavendel kan användas direkt på små områden, men vi rekommenderar alltid utspädning. Gör alltid ett lapptest först för att kontrollera för allergiska reaktioner.',
    category: 'products',
  },
  {
    id: 'products-4',
    question: 'Är produkterna säkra för husdjur?',
    answer: 'Vissa eteriska oljor kan vara skadliga för husdjur, särskilt katter. Vi rekommenderar att du konsulterar en veterinär innan du använder eteriska oljor runt husdjur. Använd alltid oljorna i väl ventilerade utrymmen och se till att husdjur kan lämna rummet om de vill.',
    category: 'products',
  },

  // Other
  {
    id: 'other-1',
    question: 'Hur kontaktar jag kundservice?',
    answer: 'Du kan kontakta vår kundservice via e-post på support@fortuneessence.se, genom vårt kontaktformulär på webbplatsen, eller via telefon på +46 10 123 4567. Våra öppettider är mån-fre 9:00-17:00. Vi svarar normalt inom 24 timmar.',
    category: 'other',
  },
  {
    id: 'other-2',
    question: 'Kan jag prenumerera på nyhetsbrevet?',
    answer: 'Ja! Prenumerera på vårt nyhetsbrev längst ner på sidan för att få exklusiva erbjudanden, produktnyheter och tips om aromaterapi. Som ny prenumerant får du 10% rabatt på din första beställning.',
    category: 'other',
  },
  {
    id: 'other-3',
    question: 'Erbjuder ni presentkort?',
    answer: 'Ja, vi erbjuder digitala presentkort i valörer från 200 kr till 2000 kr. Presentkortet skickas via e-post och kan användas direkt vid köp på vår webbplats. De är giltiga i 12 månader från köpdatum.',
    category: 'other',
  },
  {
    id: 'other-4',
    question: 'Hur hanterar ni min personliga information?',
    answer: 'Vi tar din integritet på största allvar och följer GDPR-regler strikt. Vi samlar endast in den information som är nödvändig för att behandla din beställning och förbättra din upplevelse. Din information delas aldrig med tredje part utan ditt samtycke. Läs vår fullständiga integritetspolicy för mer information.',
    category: 'other',
  },
];

const categories = [
  { id: 'all', name: 'Alla', icon: QuestionMarkCircleIcon },
  { id: 'order', name: 'Beställningar', icon: ShoppingBagIcon },
  { id: 'shipping', name: 'Frakt', icon: TruckIcon },
  { id: 'payment', name: 'Betalning', icon: CreditCardIcon },
  { id: 'returns', name: 'Returer', icon: ArrowPathIcon },
  { id: 'products', name: 'Produkter', icon: QuestionMarkCircleIcon },
  { id: 'other', name: 'Övrigt', icon: EnvelopeIcon },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-sage-600 to-forest-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              Vanliga frågor
            </h1>
            <p className="text-xl text-cream-100 mb-8">
              Hitta svar på dina frågor om beställningar, frakt, och våra produkter
            </p>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-400" />
              <input
                type="text"
                placeholder="Sök efter frågor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-forest-800 focus:outline-none focus:ring-4 focus:ring-sage-300 shadow-lg"
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
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                      activeCategory === category.id
                        ? 'bg-sage-600 text-white shadow-lg'
                        : 'bg-white text-forest-700 hover:bg-sage-50 shadow-soft'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {category.name}
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
                  className="bg-white rounded-2xl shadow-soft overflow-hidden transition-all hover:shadow-lg"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-cream-50 transition-colors"
                  >
                    <span className="font-semibold text-forest-800 pr-4">
                      {item.question}
                    </span>
                    <ChevronDownIcon
                      className={`h-5 w-5 text-forest-600 flex-shrink-0 transition-transform ${
                        openItems.has(item.id) ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {openItems.has(item.id) && (
                    <div className="px-6 pb-5 text-forest-700 leading-relaxed border-t border-cream-200 pt-4">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-4 text-forest-300" />
                <p className="text-forest-600 text-lg mb-2">Inga frågor hittades</p>
                <p className="text-forest-500">Försök med andra sökord eller kategorier</p>
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-gradient-to-br from-sage-50 to-cream-100 rounded-2xl p-8 text-center border-2 border-sage-200">
            <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 text-sage-600" />
            <h2 className="text-2xl font-serif font-bold text-forest-800 mb-2">
              Hittade du inte svaret?
            </h2>
            <p className="text-forest-700 mb-6">
              Vår kundservice hjälper dig gärna! Vi svarar normalt inom 24 timmar.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg hover:shadow-xl"
              >
                <EnvelopeIcon className="h-5 w-5" />
                Kontakta oss
              </Link>
              <a
                href="mailto:support@fortuneessence.se"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-sage-700 font-semibold hover:bg-sage-50 transition-all shadow-soft hover:shadow-lg border-2 border-sage-200"
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
