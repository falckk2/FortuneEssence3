import Link from 'next/link';
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function RefundPage() {
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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center">
              <ArrowPathIcon className="h-6 w-6 text-sage-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-800">
              {locale === 'sv' ? 'Retur- och återbetalningspolicy' : 'Return & Refund Policy'}
            </h1>
          </div>

          <p className="text-forest-600 mb-8">
            {locale === 'sv'
              ? 'Senast uppdaterad: ' + new Date().toLocaleDateString('sv-SE')
              : 'Last updated: ' + new Date().toLocaleDateString('en-US')
            }
          </p>

          <div className="prose prose-forest max-w-none">
            {locale === 'sv' ? (
              <>
                <h2>1. Ångerrätt - 14 dagar</h2>
                <p>
                  Enligt distansavtalslagen har du som konsument 14 dagars ångerrätt från det att
                  du har tagit emot varan. Detta innebär att du kan returnera produkten utan att
                  ange någon anledning.
                </p>

                <h2>2. Villkor för retur</h2>
                <p>För att du ska kunna utnyttja din ångerrätt måste följande villkor uppfyllas:</p>
                <ul>
                  <li>Produkten måste vara oöppnad och i originalförpackning</li>
                  <li>Produkten får inte ha använts eller skadats</li>
                  <li>Alla etiketter och förseg lingar måste vara intakta</li>
                  <li>Returen måste ske inom 14 dagar från mottagandet</li>
                </ul>

                <h2>3. Undantag från ångerrätten</h2>
                <p>Ångerrätten gäller inte för:</p>
                <ul>
                  <li>Förseglade varor som öppnats av hälso- eller hygienskäl (eteriska oljor)</li>
                  <li>Specialbeställda eller personligt anpassade produkter</li>
                  <li>Presentkort och presentcheckar</li>
                </ul>

                <h2>4. Hur gör jag en retur?</h2>
                <p>För att returnera en produkt, följ dessa steg:</p>
                <ol>
                  <li>Kontakta vår kundservice på info@fortuneessence.se eller +46 12 345 67 89</li>
                  <li>Ange ditt ordernummer och vilka produkter du vill returnera</li>
                  <li>Vi skickar dig en returlabel och instruktioner</li>
                  <li>Paketera produkten säkert i originalförpackningen</li>
                  <li>Skicka paketet till den adress vi anger</li>
                </ol>

                <h2>5. Returkostnader</h2>
                <p>
                  Vid utnyttjande av ångerrätten står du för returfrakten, om inte produkten är
                  felaktig eller skadad. Kostnaden för returfrakten är cirka 69-99 kr beroende på
                  paketets vikt och storlek.
                </p>

                <h2>6. Återbetalning</h2>
                <p>
                  När vi har mottagit och godkänt din retur återbetalar vi dig inom 14 dagar.
                  Återbetalningen sker till samma betalningsmetod som du använde vid köpet.
                  Vi återbetalar produktens pris, men inte fraktkostnaden (om du inte fick fri frakt).
                </p>

                <h2>7. Reklamation vid fel</h2>
                <p>
                  Om produkten är felaktig eller skadad vid leverans har du rätt till reklamation
                  enligt konsumentköplagen. Kontakta oss omedelbart så hjälper vi dig med:
                </p>
                <ul>
                  <li>Byte till ny produkt (om vi har den i lager)</li>
                  <li>Reparation av produkten</li>
                  <li>Prisavdrag</li>
                  <li>Hävning av köpet med full återbetalning</li>
                </ul>
                <p>
                  Vid reklamation betalar vi för returfrakten och du får full återbetalning inklusive
                  fraktkostnad.
                </p>

                <h2>8. Skador vid transport</h2>
                <p>
                  Om paketet är skadat när du tar emot det, vänligen dokumentera skadorna med
                  foto och kontakta oss inom 48 timmar. Vi ordnar med ersättning eller skickar
                  en ny produkt utan extra kostnad.
                </p>

                <h2>9. Byte till annan produkt</h2>
                <p>
                  Om du vill byta till en annan produkt eller storlek, gör en retur enligt
                  instruktionerna ovan och lägg sedan en ny beställning på den produkt du önskar.
                  Detta säkerställer snabbast hantering.
                </p>

                <h2>10. Kontakta oss</h2>
                <p>
                  Vid frågor om returer och återbetalningar, kontakta vår kundservice:<br />
                  E-post: info@fortuneessence.se<br />
                  Telefon: +46 12 345 67 89<br />
                  Öppettider: Mån-Fre 9:00-17:00
                </p>

                <div className="mt-8 p-6 bg-sage-50 border border-sage-200 rounded-2xl">
                  <h3 className="font-semibold text-forest-800 mb-2">
                    📦 Snabbtips för smidig retur
                  </h3>
                  <ul className="text-sm text-forest-700 space-y-1">
                    <li>• Kontakta oss innan du skickar tillbaka paketet</li>
                    <li>• Inkludera ordernummer och ditt namn</li>
                    <li>• Paketera produkten väl för att undvika skador under transporten</li>
                    <li>• Spara fraktkvittot tills återbetalningen är klar</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <h2>1. Right of Withdrawal - 14 Days</h2>
                <p>
                  According to the Distance Contracts Act, you as a consumer have a 14-day right
                  of withdrawal from receipt of the goods. This means you can return the product
                  without stating any reason.
                </p>

                <h2>2. Return Conditions</h2>
                <p>To exercise your right of withdrawal, the following conditions must be met:</p>
                <ul>
                  <li>The product must be unopened and in original packaging</li>
                  <li>The product must not be used or damaged</li>
                  <li>All labels and seals must be intact</li>
                  <li>The return must be made within 14 days of receipt</li>
                </ul>

                <h2>3. Exceptions to Right of Withdrawal</h2>
                <p>The right of withdrawal does not apply to:</p>
                <ul>
                  <li>Sealed goods opened for health or hygiene reasons (essential oils)</li>
                  <li>Custom-made or personalized products</li>
                  <li>Gift cards and vouchers</li>
                </ul>

                <h2>4. How Do I Make a Return?</h2>
                <p>To return a product, follow these steps:</p>
                <ol>
                  <li>Contact our customer service at info@fortuneessence.se or +46 12 345 67 89</li>
                  <li>Provide your order number and which products you want to return</li>
                  <li>We will send you a return label and instructions</li>
                  <li>Pack the product securely in its original packaging</li>
                  <li>Send the package to the address we specify</li>
                </ol>

                <h2>5. Return Costs</h2>
                <p>
                  When exercising the right of withdrawal, you are responsible for return shipping,
                  unless the product is defective or damaged. The cost of return shipping is
                  approximately 69-99 SEK depending on package weight and size.
                </p>

                <h2>6. Refund</h2>
                <p>
                  Once we have received and approved your return, we will refund you within 14 days.
                  The refund will be made to the same payment method you used for the purchase.
                  We refund the product price but not the shipping cost (unless you received free shipping).
                </p>

                <h2>7. Complaint for Defects</h2>
                <p>
                  If the product is defective or damaged upon delivery, you have the right to make
                  a complaint according to the Consumer Sales Act. Contact us immediately and we will help you with:
                </p>
                <ul>
                  <li>Exchange for a new product (if we have it in stock)</li>
                  <li>Repair of the product</li>
                  <li>Price reduction</li>
                  <li>Cancellation of purchase with full refund</li>
                </ul>
                <p>
                  For complaints, we pay for return shipping and you get a full refund including shipping cost.
                </p>

                <h2>8. Transport Damage</h2>
                <p>
                  If the package is damaged when you receive it, please document the damage with
                  photos and contact us within 48 hours. We will arrange for compensation or send
                  a new product at no extra cost.
                </p>

                <h2>9. Exchange for Another Product</h2>
                <p>
                  If you want to exchange for another product or size, make a return according to
                  the instructions above and then place a new order for the product you want.
                  This ensures fastest processing.
                </p>

                <h2>10. Contact Us</h2>
                <p>
                  For questions about returns and refunds, contact our customer service:<br />
                  Email: info@fortuneessence.se<br />
                  Phone: +46 12 345 67 89<br />
                  Hours: Mon-Fri 9:00-17:00
                </p>

                <div className="mt-8 p-6 bg-sage-50 border border-sage-200 rounded-2xl">
                  <h3 className="font-semibold text-forest-800 mb-2">
                    📦 Quick Tips for Smooth Returns
                  </h3>
                  <ul className="text-sm text-forest-700 space-y-1">
                    <li>• Contact us before sending the package back</li>
                    <li>• Include order number and your name</li>
                    <li>• Pack the product well to avoid damage during transport</li>
                    <li>• Save the shipping receipt until the refund is complete</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
