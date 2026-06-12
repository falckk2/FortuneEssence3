/**
 * FAQ content, shared between the server page (FAQPage JSON-LD, metadata) and
 * the client accordion UI. Locale-keyed so URL-based locales (FABLE-011) and
 * future Nordic locales only need new keys here, not component changes.
 */

import type { Locale } from '@/types';

export type FAQCategory = 'order' | 'shipping' | 'payment' | 'returns' | 'products' | 'other';

export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: Record<Locale, string>;
  answer: Record<Locale, string>;
}

export const faqCategories: { id: FAQCategory | 'all'; name: Record<Locale, string> }[] = [
  { id: 'all', name: { sv: 'Alla', en: 'All' } },
  { id: 'order', name: { sv: 'Beställningar', en: 'Orders' } },
  { id: 'shipping', name: { sv: 'Frakt', en: 'Shipping' } },
  { id: 'payment', name: { sv: 'Betalning', en: 'Payment' } },
  { id: 'returns', name: { sv: 'Returer', en: 'Returns' } },
  { id: 'products', name: { sv: 'Produkter', en: 'Products' } },
  { id: 'other', name: { sv: 'Övrigt', en: 'Other' } },
];

export const faqData: FAQItem[] = [
  // Orders
  {
    id: 'order-1',
    category: 'order',
    question: {
      sv: 'Hur lägger jag en beställning?',
      en: 'How do I place an order?',
    },
    answer: {
      sv: 'För att lägga en beställning, bläddra bland våra produkter, lägg de önskade produkterna i varukorgen och följ kassaprocessen. Du kan handla som gäst eller skapa ett konto för att spara dina uppgifter och spåra beställningar enklare.',
      en: 'To place an order, browse our products, add the items you want to your cart and follow the checkout process. You can shop as a guest or create an account to save your details and track orders more easily.',
    },
  },
  {
    id: 'order-2',
    category: 'order',
    question: {
      sv: 'Kan jag ändra eller avbryta min beställning?',
      en: 'Can I change or cancel my order?',
    },
    answer: {
      sv: 'Du kan avbryta din beställning innan den har skickats. När beställningen väl har markerats som "skickad" kan den inte längre avbrytas. Kontakta vår kundservice omedelbart på support@fortuneessence.se eller via kontaktformuläret om du behöver göra ändringar.',
      en: 'You can cancel your order before it has been shipped. Once the order has been marked as "shipped" it can no longer be cancelled. Contact our customer service immediately at support@fortuneessence.se or via the contact form if you need to make changes.',
    },
  },
  {
    id: 'order-3',
    category: 'order',
    question: {
      sv: 'Får jag en orderbekräftelse?',
      en: 'Will I receive an order confirmation?',
    },
    answer: {
      sv: 'Ja, du kommer att få en bekräftelse via e-post så snart din beställning har lagts. Om du inte får ett e-postmeddelande inom 10 minuter, kontrollera din skräppostmapp eller kontakta vår kundservice.',
      en: 'Yes, you will receive a confirmation by email as soon as your order has been placed. If you do not receive an email within 10 minutes, check your spam folder or contact our customer service.',
    },
  },
  {
    id: 'order-4',
    category: 'order',
    question: {
      sv: 'Hur spårar jag min beställning?',
      en: 'How do I track my order?',
    },
    answer: {
      sv: 'När din beställning har skickats får du ett e-postmeddelande med ett spårningsnummer. Du kan också logga in på ditt konto och besöka "Mina beställningar" för att se statusen på alla dina beställningar och spårningsinformation.',
      en: 'When your order has been shipped you will receive an email with a tracking number. You can also sign in to your account and visit "My orders" to see the status and tracking information for all your orders.',
    },
  },

  // Shipping
  {
    id: 'shipping-1',
    category: 'shipping',
    question: {
      sv: 'Vilka fraktalternativ erbjuder ni?',
      en: 'Which shipping options do you offer?',
    },
    answer: {
      sv: 'Vi erbjuder ett brett utbud av fraktalternativ för att passa alla behov: PostNord (Standard, Paket, Express), DHL (Standard, Express), Bring (Hemleverans, Servicepoint, Pickup), DB Schenker (Hemleverans, Paketbox, Servicepoint), Instabee (Samma dag, Kvällsleverans), Budbee (Hemleverans, Box, Locker), Instabox (Paketskåp, Servicepoint) och Early Bird (Klimatneutral Standard och Express). Välj det alternativ som passar dig bäst vid kassan!',
      en: 'We offer a wide range of shipping options to suit every need: PostNord (Standard, Parcel, Express), DHL (Standard, Express), Bring (Home delivery, Service point, Pickup), DB Schenker (Home delivery, Parcel box, Service point), Instabee (Same day, Evening delivery), Budbee (Home delivery, Box, Locker), Instabox (Parcel locker, Service point) and Early Bird (Climate-neutral Standard and Express). Choose the option that suits you best at checkout!',
    },
  },
  {
    id: 'shipping-2',
    category: 'shipping',
    question: {
      sv: 'Är frakten gratis?',
      en: 'Is shipping free?',
    },
    answer: {
      sv: 'Ja, vi erbjuder gratis frakt på alla beställningar över 500 kr inom Sverige. För beställningar under 500 kr tillkommer fraktkostnaden beroende på vilket fraktalternativ du väljer.',
      en: 'Yes, we offer free shipping on all orders over 500 SEK within Sweden. For orders under 500 SEK a shipping fee is added depending on which shipping option you choose.',
    },
  },
  {
    id: 'shipping-3',
    category: 'shipping',
    question: {
      sv: 'Hur lång tid tar leveransen?',
      en: 'How long does delivery take?',
    },
    answer: {
      sv: 'Leveranstiden beror på vilket fraktalternativ du väljer. Expressleverans med PostNord eller DHL tar 1-2 arbetsdagar, standardleverans 2-4 arbetsdagar. För ännu snabbare leverans erbjuder Instabee samma dags leverans i vissa områden. Budbee, Instabox och DB Schenker levererar normalt nästa arbetsdag. Beställningar som läggs före kl. 14:00 på vardagar skickas normalt samma dag.',
      en: 'Delivery time depends on which shipping option you choose. Express delivery with PostNord or DHL takes 1-2 business days, standard delivery 2-4 business days. For even faster delivery, Instabee offers same-day delivery in some areas. Budbee, Instabox and DB Schenker normally deliver the next business day. Orders placed before 2 PM on weekdays are normally shipped the same day.',
    },
  },
  {
    id: 'shipping-4',
    category: 'shipping',
    question: {
      sv: 'Levererar ni internationellt?',
      en: 'Do you ship internationally?',
    },
    answer: {
      sv: 'Just nu levererar vi endast inom Sverige. Vi arbetar på att utöka våra leveransalternativ till fler länder i framtiden. Håll utkik på vår webbplats för uppdateringar!',
      en: 'At the moment we only ship within Sweden. We are working on expanding our delivery options to more countries in the future. Keep an eye on our website for updates!',
    },
  },
  {
    id: 'shipping-5',
    category: 'shipping',
    question: {
      sv: 'Finns det miljövänliga fraktalternativ?',
      en: 'Are there eco-friendly shipping options?',
    },
    answer: {
      sv: 'Ja! Vi erbjuder klimatneutrala och miljövänliga fraktalternativ. Early Bird använder fossilfri transport och kompenserar för CO2-utsläpp. Budbee är också ett miljövänligt alternativ med klimatkompenserade leveranser. Välj dessa alternativ i kassan för att göra ett mer hållbart val.',
      en: 'Yes! We offer climate-neutral and eco-friendly shipping options. Early Bird uses fossil-free transport and offsets CO2 emissions. Budbee is also an environmentally friendly option with climate-compensated deliveries. Choose these options at checkout to make a more sustainable choice.',
    },
  },
  {
    id: 'shipping-6',
    category: 'shipping',
    question: {
      sv: 'Kan jag välja leverans till paketbox eller paketskåp?',
      en: 'Can I choose delivery to a parcel box or parcel locker?',
    },
    answer: {
      sv: 'Ja! Vi erbjuder flera bekväma hämtalternativ: DB Schenker Paketbox, Budbee Box och Locker, samt Instabox Locker. Dessa paketboxar och paketskåp är tillgängliga 24/7 så du kan hämta ditt paket när det passar dig. Vissa servicepoints erbjuder också förlängd uthämtningstid.',
      en: 'Yes! We offer several convenient pickup options: DB Schenker Parcel Box, Budbee Box and Locker, and Instabox Locker. These parcel boxes and lockers are available 24/7 so you can pick up your package whenever it suits you. Some service points also offer extended pickup times.',
    },
  },

  // Payment
  {
    id: 'payment-1',
    category: 'payment',
    question: {
      sv: 'Vilka betalningsmetoder accepterar ni?',
      en: 'Which payment methods do you accept?',
    },
    answer: {
      sv: 'Vi accepterar Swish, Klarna (faktura och delbetalning) och kreditkort (Visa, Mastercard, American Express) via Stripe. Alla betalningar är säkra och krypterade.',
      en: 'We accept Swish, Klarna (invoice and instalments) and credit cards (Visa, Mastercard, American Express) via Stripe. All payments are secure and encrypted.',
    },
  },
  {
    id: 'payment-2',
    category: 'payment',
    question: {
      sv: 'Är det säkert att handla hos er?',
      en: 'Is it safe to shop with you?',
    },
    answer: {
      sv: 'Ja, absolut. Vi använder SSL-kryptering för alla transaktioner och lagrar aldrig dina kortuppgifter. Våra betalningar hanteras av säkra betalningsleverantörer som Stripe och Klarna. Vi följer också GDPR-regler för att skydda din personliga information.',
      en: 'Yes, absolutely. We use SSL encryption for all transactions and never store your card details. Our payments are handled by secure payment providers such as Stripe and Klarna. We also follow GDPR rules to protect your personal information.',
    },
  },
  {
    id: 'payment-3',
    category: 'payment',
    question: {
      sv: 'Kan jag betala med faktura?',
      en: 'Can I pay by invoice?',
    },
    answer: {
      sv: 'Ja, genom Klarna kan du välja att betala med faktura. Du får då 14 dagar på dig att betala efter att du mottagit din beställning. Detta alternativ är tillgängligt för kunder i Sverige.',
      en: 'Yes, through Klarna you can choose to pay by invoice. You then have 14 days to pay after receiving your order. This option is available for customers in Sweden.',
    },
  },
  {
    id: 'payment-4',
    category: 'payment',
    question: {
      sv: 'Varför avvisades min betalning?',
      en: 'Why was my payment declined?',
    },
    answer: {
      sv: 'Betalningar kan avvisas av flera anledningar: otillräckliga medel, felaktiga kortuppgifter, säkerhetsrestriktioner från din bank, eller överskriden kreditgräns. Kontakta din bank för mer information eller prova en annan betalningsmetod.',
      en: 'Payments can be declined for several reasons: insufficient funds, incorrect card details, security restrictions from your bank, or an exceeded credit limit. Contact your bank for more information or try another payment method.',
    },
  },

  // Returns
  {
    id: 'returns-1',
    category: 'returns',
    question: {
      sv: 'Vad är er returpolicy?',
      en: 'What is your return policy?',
    },
    answer: {
      sv: 'Vi erbjuder 14 dagars öppet köp från det att du mottagit din beställning. Produkterna måste vara oöppnade och i originalförpackning. Öppnade eteriska oljor och bäraroljor kan inte returneras av hälso- och säkerhetsskäl.',
      en: 'We offer a 14-day right of return from the day you receive your order. Products must be unopened and in their original packaging. Opened essential oils and carrier oils cannot be returned for health and safety reasons.',
    },
  },
  {
    id: 'returns-2',
    category: 'returns',
    question: {
      sv: 'Hur returnerar jag en produkt?',
      en: 'How do I return a product?',
    },
    answer: {
      sv: 'Kontakta vår kundservice på support@fortuneessence.se eller via kontaktformuläret på webbplatsen. Uppge ditt ordernummer och beskriv vilka produkter du vill returnera. Vi skickar dig instruktioner för hur du returnerar din beställning. När vi mottagit returen kommer vi att behandla din återbetalning inom 5-10 arbetsdagar.',
      en: 'Contact our customer service at support@fortuneessence.se or via the contact form on the website. Provide your order number and describe which products you want to return. We will send you instructions for returning your order. Once we have received the return, we will process your refund within 5-10 business days.',
    },
  },
  {
    id: 'returns-3',
    category: 'returns',
    question: {
      sv: 'Vem betalar returfrakten?',
      en: 'Who pays for return shipping?',
    },
    answer: {
      sv: 'Om du returnerar en produkt på grund av ångerrätt står du för returfrakten. Om produkten är defekt eller om vi har skickat fel vara står vi för returfrakten. Kontakta vår kundservice i dessa fall innan du returnerar varan.',
      en: 'If you return a product under the right of withdrawal, you pay for the return shipping. If the product is defective or we have sent the wrong item, we cover the return shipping. Contact our customer service in those cases before returning the item.',
    },
  },
  {
    id: 'returns-4',
    category: 'returns',
    question: {
      sv: 'När får jag tillbaka mina pengar?',
      en: 'When will I get my money back?',
    },
    answer: {
      sv: 'När vi har mottagit och godkänt din retur bearbetas återbetalningen inom 5-10 arbetsdagar. Pengarna återbetalas till samma betalningsmetod som användes vid köpet. Det kan ta ytterligare 3-5 arbetsdagar innan pengarna syns på ditt konto beroende på din bank.',
      en: 'Once we have received and approved your return, the refund is processed within 5-10 business days. The money is refunded to the same payment method used for the purchase. It can take an additional 3-5 business days before the money appears in your account depending on your bank.',
    },
  },

  // Products
  {
    id: 'products-1',
    category: 'products',
    question: {
      sv: 'Är era eteriska oljor rena och naturliga?',
      en: 'Are your essential oils pure and natural?',
    },
    answer: {
      sv: 'Ja, alla våra eteriska oljor är 100% rena och naturliga. Vi använder inga syntetiska tillsatser, fyllmedel eller utspädningsmedel.',
      en: 'Yes, all our essential oils are 100% pure and natural. We use no synthetic additives, fillers or diluents.',
    },
  },
  {
    id: 'products-2',
    category: 'products',
    question: {
      sv: 'Hur ska jag förvara mina eteriska oljor?',
      en: 'How should I store my essential oils?',
    },
    answer: {
      sv: 'Förvara dina eteriska oljor i en sval, mörk plats borta från direkt solljus och värmekällor. Håll flaskorna väl förslutna när de inte används. Vid korrekt förvaring håller de flesta eteriska oljor i 2-3 år, citrusoljor i ca 1-2 år.',
      en: 'Store your essential oils in a cool, dark place away from direct sunlight and heat sources. Keep the bottles tightly closed when not in use. With proper storage most essential oils last 2-3 years, citrus oils about 1-2 years.',
    },
  },
  {
    id: 'products-3',
    category: 'products',
    question: {
      sv: 'Kan jag använda eteriska oljor direkt på huden?',
      en: 'Can I use essential oils directly on my skin?',
    },
    answer: {
      sv: 'De flesta eteriska oljor bör spädas ut med en bärarolja innan de appliceras på huden. Vissa milda oljor som lavendel kan användas direkt på små områden, men vi rekommenderar alltid utspädning. Gör alltid ett lapptest först för att kontrollera för allergiska reaktioner.',
      en: 'Most essential oils should be diluted with a carrier oil before being applied to the skin. Some mild oils such as lavender can be used directly on small areas, but we always recommend dilution. Always do a patch test first to check for allergic reactions.',
    },
  },
  {
    id: 'products-4',
    category: 'products',
    question: {
      sv: 'Är produkterna säkra för husdjur?',
      en: 'Are the products safe for pets?',
    },
    answer: {
      sv: 'Vissa eteriska oljor kan vara skadliga för husdjur, särskilt katter. Vi rekommenderar att du konsulterar en veterinär innan du använder eteriska oljor runt husdjur. Använd alltid oljorna i väl ventilerade utrymmen och se till att husdjur kan lämna rummet om de vill.',
      en: 'Some essential oils can be harmful to pets, especially cats. We recommend consulting a veterinarian before using essential oils around pets. Always use the oils in well-ventilated spaces and make sure pets can leave the room if they want to.',
    },
  },

  // Other
  {
    id: 'other-1',
    category: 'other',
    question: {
      sv: 'Hur kontaktar jag kundservice?',
      en: 'How do I contact customer service?',
    },
    answer: {
      sv: 'Du kan kontakta vår kundservice via e-post på support@fortuneessence.se, genom vårt kontaktformulär på webbplatsen. Vi svarar normalt inom 24 timmar.',
      en: 'You can contact our customer service by email at support@fortuneessence.se or through our contact form on the website. We normally reply within 24 hours.',
    },
  },
  {
    id: 'other-2',
    category: 'other',
    question: {
      sv: 'Hur håller jag mig uppdaterad om nya produkter och erbjudanden?',
      en: 'How do I stay updated on new products and offers?',
    },
    answer: {
      sv: 'Följ oss på sociala medier eller kontakta vår kundservice på support@fortuneessence.se så håller vi dig informerad om nya produkter, säsongserbjudanden och tips om aromaterapi.',
      en: 'Follow us on social media or contact our customer service at support@fortuneessence.se and we will keep you informed about new products, seasonal offers and aromatherapy tips.',
    },
  },
  {
    id: 'other-4',
    category: 'other',
    question: {
      sv: 'Hur hanterar ni min personliga information?',
      en: 'How do you handle my personal information?',
    },
    answer: {
      sv: 'Vi tar din integritet på största allvar och följer GDPR-regler strikt. Vi samlar endast in den information som är nödvändig för att behandla din beställning och förbättra din upplevelse. Din information delas aldrig med tredje part utan ditt samtycke. Läs vår fullständiga integritetspolicy för mer information.',
      en: 'We take your privacy very seriously and strictly follow GDPR rules. We only collect the information necessary to process your order and improve your experience. Your information is never shared with third parties without your consent. Read our full privacy policy for more information.',
    },
  },
];

/**
 * Build a schema.org FAQPage object for the given locale.
 * Rendered as JSON-LD by the FAQ server page.
 */
export function buildFaqJsonLd(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(item => ({
      '@type': 'Question',
      name: item.question[locale],
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer[locale],
      },
    })),
  };
}
