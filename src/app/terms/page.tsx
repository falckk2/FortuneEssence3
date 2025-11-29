import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function TermsPage() {
  const locale = 'sv'; // Would come from context in real app

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center text-forest-600 hover:text-sage-700 transition-colors mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span className="font-medium">
            {locale === 'sv' ? 'Tillbaka till startsidan' : 'Back to Home'}
          </span>
        </Link>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-soft p-8 lg:p-12">
          <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-800 mb-6">
            {locale === 'sv' ? 'Allmänna villkor' : 'Terms & Conditions'}
          </h1>

          <p className="text-forest-600 mb-8">
            {locale === 'sv'
              ? 'Senast uppdaterad: ' + new Date().toLocaleDateString('sv-SE')
              : 'Last updated: ' + new Date().toLocaleDateString('en-US')
            }
          </p>

          <div className="prose prose-forest max-w-none">
            {locale === 'sv' ? (
              <>
                <h2>1. Allmänt</h2>
                <p>
                  Välkommen till Fortune Essence. Genom att använda vår webbplats och köpa våra produkter
                  accepterar du dessa allmänna villkor. Läs dem noggrant innan du gör ett köp.
                </p>

                <h2>2. Produkter och priser</h2>
                <p>
                  Alla priser på vår webbplats anges i svenska kronor (SEK) och inkluderar moms om inte annat anges.
                  Vi förbehåller oss rätten att ändra priser utan förhandsbesked. Produktbilder är vägledande
                  och faktisk färg kan skilja sig något från bilden.
                </p>

                <h2>3. Beställning och bekräftelse</h2>
                <p>
                  När du lägger en beställning får du en orderbekräftelse via e-post. Detta utgör vårt
                  accepterande av din beställning. Vi förbehåller oss rätten att avböja beställningar
                  av valfri anledning.
                </p>

                <h2>4. Betalning</h2>
                <p>
                  Vi accepterar följande betalningsmetoder: Swish, Klarna, kreditkort (Visa, Mastercard)
                  och bankgiro. Betalning sker säkert via våra betaltjänstleverantörer. Din betalning
                  behandlas när beställningen bekräftas.
                </p>

                <h2>5. Leverans</h2>
                <p>
                  Vi levererar till hela Sverige. Leveranstiden är normalt 2-4 arbetsdagar från det att
                  beställningen har bekräftats. Vi samarbetar med PostNord, DHL och Bring för leverans.
                  Fraktkostnader beräknas vid kassan baserat på vikt och destination.
                </p>

                <h2>6. Ångerrätt</h2>
                <p>
                  Enligt distansavtalslagen har du som konsument 14 dagars ångerrätt från det att du
                  tagit emot varan. För att utnyttja ångerrätten ska produkten vara oöppnad och i
                  originalförpackning. Kontakta vår kundservice för returinstruktioner.
                </p>

                <h2>7. Reklamation</h2>
                <p>
                  Om produkten är felaktig eller skadad vid leverans, kontakta oss inom skälig tid.
                  Vi åtgärdar felet genom reparation, byte eller återbetalning enligt konsumentköplagen.
                </p>

                <h2>8. Force majeure</h2>
                <p>
                  Vi ansvarar inte för förseningar eller utebliven leverans på grund av omständigheter
                  utanför vår kontroll, såsom naturkatastrofer, krig, strejk eller leverantörsproblem.
                </p>

                <h2>9. Personuppgifter</h2>
                <p>
                  Vi behandlar dina personuppgifter enligt vår{' '}
                  <Link href="/privacy" className="text-sage-700 hover:underline">
                    integritetspolicy
                  </Link>
                  . Vi följer GDPR och svenska dataskyddslagar.
                </p>

                <h2>10. Ändringar av villkor</h2>
                <p>
                  Vi förbehåller oss rätten att ändra dessa villkor. Ändringar träder i kraft när de
                  publiceras på webbplatsen. Vi rekommenderar att du regelbundet läser igenom villkoren.
                </p>

                <h2>11. Tillämplig lag och tvister</h2>
                <p>
                  Svensk lag ska tillämpas på dessa villkor. Tvister ska i första hand lösas genom
                  förhandling. Om en överenskommelse inte kan nås kan tvisten hänskjutas till Allmänna
                  reklamationsnämnden (ARN) eller svensk domstol.
                </p>

                <h2>12. Kontaktuppgifter</h2>
                <p>
                  Fortune Essence<br />
                  E-post: info@fortuneessence.se<br />
                  Telefon: +46 12 345 67 89<br />
                  Adress: Stockholm, Sverige
                </p>
              </>
            ) : (
              <>
                <h2>1. General</h2>
                <p>
                  Welcome to Fortune Essence. By using our website and purchasing our products,
                  you accept these terms and conditions. Please read them carefully before making a purchase.
                </p>

                <h2>2. Products and Prices</h2>
                <p>
                  All prices on our website are stated in Swedish Kronor (SEK) and include VAT unless
                  otherwise stated. We reserve the right to change prices without prior notice. Product
                  images are for guidance and actual color may differ slightly from the image.
                </p>

                <h2>3. Order and Confirmation</h2>
                <p>
                  When you place an order, you will receive an order confirmation via email. This
                  constitutes our acceptance of your order. We reserve the right to decline orders
                  for any reason.
                </p>

                <h2>4. Payment</h2>
                <p>
                  We accept the following payment methods: Swish, Klarna, credit cards (Visa, Mastercard),
                  and bank transfer. Payment is made securely through our payment service providers.
                  Your payment is processed when the order is confirmed.
                </p>

                <h2>5. Delivery</h2>
                <p>
                  We deliver throughout Sweden. Delivery time is normally 2-4 business days from when
                  the order has been confirmed. We partner with PostNord, DHL, and Bring for delivery.
                  Shipping costs are calculated at checkout based on weight and destination.
                </p>

                <h2>6. Right of Withdrawal</h2>
                <p>
                  According to the Distance Contracts Act, you as a consumer have a 14-day right of
                  withdrawal from receipt of the goods. To exercise the right of withdrawal, the product
                  must be unopened and in original packaging. Contact our customer service for return instructions.
                </p>

                <h2>7. Complaints</h2>
                <p>
                  If the product is defective or damaged upon delivery, contact us within reasonable time.
                  We will remedy the defect through repair, replacement, or refund according to the
                  Consumer Sales Act.
                </p>

                <h2>8. Force Majeure</h2>
                <p>
                  We are not responsible for delays or non-delivery due to circumstances beyond our control,
                  such as natural disasters, war, strikes, or supplier issues.
                </p>

                <h2>9. Personal Data</h2>
                <p>
                  We process your personal data according to our{' '}
                  <Link href="/privacy" className="text-sage-700 hover:underline">
                    privacy policy
                  </Link>
                  . We comply with GDPR and Swedish data protection laws.
                </p>

                <h2>10. Changes to Terms</h2>
                <p>
                  We reserve the right to change these terms. Changes take effect when published on
                  the website. We recommend that you regularly review the terms.
                </p>

                <h2>11. Applicable Law and Disputes</h2>
                <p>
                  Swedish law shall apply to these terms. Disputes shall primarily be resolved through
                  negotiation. If an agreement cannot be reached, the dispute may be referred to the
                  General Complaints Board (ARN) or Swedish court.
                </p>

                <h2>12. Contact Information</h2>
                <p>
                  Fortune Essence<br />
                  Email: info@fortuneessence.se<br />
                  Phone: +46 12 345 67 89<br />
                  Address: Stockholm, Sweden
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
