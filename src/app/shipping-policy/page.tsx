import Link from 'next/link';
import { ArrowLeftIcon, TruckIcon } from '@heroicons/react/24/outline';

export default function ShippingPolicyPage() {
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
              <TruckIcon className="h-6 w-6 text-sage-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-800">
              {locale === 'sv' ? 'Frakt och leverans' : 'Shipping & Delivery'}
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
                <h2>1. Leveransområde</h2>
                <p>
                  Vi levererar för närvarande till hela Sverige. Leverans till övriga länder
                  planeras att införas framöver. Kontakta oss om du önskar leverans utanför Sverige.
                </p>

                <h2>2. Leveranstider</h2>
                <p>Normal leveranstid är 2-4 arbetsdagar från det att beställningen har bekräftats och betalningen har registrerats.</p>
                <ul>
                  <li><strong>Stockholm, Göteborg, Malmö:</strong> 2-3 arbetsdagar</li>
                  <li><strong>Övriga Sverige:</strong> 3-4 arbetsdagar</li>
                  <li><strong>Norrland och glesbygd:</strong> 4-5 arbetsdagar</li>
                </ul>
                <p>
                  <em>OBS:</em> Leveranstiderna är vägledande och kan påverkas av högtider,
                  helger och speciella omständigheter.
                </p>

                <h2>3. Fraktalternativ</h2>

                <h3>PostNord</h3>
                <ul>
                  <li><strong>PostNord Standard:</strong> 49 kr | 3-4 arbetsdagar</li>
                  <li><strong>PostNord Paket:</strong> 69 kr | 2-3 arbetsdagar | Spårning</li>
                  <li><strong>PostNord Express:</strong> 129 kr | 1-2 arbetsdagar | Spårning</li>
                </ul>

                <h3>DHL</h3>
                <ul>
                  <li><strong>DHL Standard:</strong> 59 kr | 3-4 arbetsdagar | Spårning</li>
                  <li><strong>DHL Express:</strong> 149 kr | 1-2 arbetsdagar | Spårning</li>
                </ul>

                <h3>Bring</h3>
                <ul>
                  <li><strong>Bring Hemleverans:</strong> 89 kr | 2-3 arbetsdagar | Spårning</li>
                  <li><strong>Bring Servicepoint:</strong> 59 kr | 2-3 arbetsdagar | Spårning</li>
                </ul>

                <h2>4. Fri frakt</h2>
                <p>
                  Vi erbjuder <strong>fri frakt vid köp över 500 kr</strong> inom Sverige.
                  Fri frakt gäller för standardleverans (PostNord eller DHL Standard).
                  För snabbare leverans tillkommer expeditionsavgift.
                </p>

                <h2>5. Spårning av paket</h2>
                <p>
                  När din beställning har skickats får du ett e-postmeddelande med spårningsnummer.
                  Du kan följa ditt paket genom att klicka på spårningslänken i e-postmeddelandet
                  eller besöka vår{' '}
                  <Link href="/orders/track" className="text-sage-700 hover:underline">
                    spårningssida
                  </Link>.
                </p>

                <h2>6. Leveransmetod</h2>
                <ul>
                  <li><strong>Hemleverans:</strong> Paketet levereras till din dörr</li>
                  <li><strong>Utlämningsställe:</strong> Hämta paketet på närmaste ombud</li>
                  <li><strong>Paketbox:</strong> Leverans till paketbox (där tillgängligt)</li>
                </ul>
                <p>
                  Du väljer leveransmetod vid kassan. Tillgängligheten kan variera beroende på
                  din adress och valt fraktalternativ.
                </p>

                <h2>7. Orderhantering</h2>
                <p>
                  Beställningar som kommer in innan kl. 14:00 på vardagar hanteras samma dag.
                  Beställningar som kommer in efter kl. 14:00 eller på helger hanteras nästa vardag.
                </p>

                <h2>8. Förpackning</h2>
                <p>
                  Vi förpackar alla produkter säkert och miljövänligt. Våra eteriska oljor
                  förpackas med extra skydd för att undvika spill och skador under transporten.
                  Vi använder återvinningsbart förpackningsmaterial när det är möjligt.
                </p>

                <h2>9. Försening av leverans</h2>
                <p>
                  Om ditt paket inte har anlänt inom angiven leveranstid, vänligen kontakta oss.
                  Vi hjälper dig att spåra paketet och hitta en lösning. Vid väsentlig försening
                  som beror på oss har du rätt till ersättning enligt konsumentköplagen.
                </p>

                <h2>10. Skadade paket</h2>
                <p>
                  Om paketet är skadat när du tar emot det:
                </p>
                <ul>
                  <li>Ta bilder på skadorna och förpackningen</li>
                  <li>Kontakta oss inom 48 timmar på info@fortuneessence.se</li>
                  <li>Behåll produkten och förpackningen tills ärendet är löst</li>
                </ul>
                <p>
                  Vi skickar en ny produkt eller återbetalar dig utan extra kostnad.
                </p>

                <h2>11. Upphämtning av paket</h2>
                <p>
                  Om du inte hämtar ut ditt paket på utlämningsstället inom den angivna tiden
                  (vanligtvis 14 dagar) returneras paketet till oss. Du kommer då att debiteras
                  för returfrakten (cirka 69-99 kr) och vi återbetalar resterande belopp.
                </p>

                <h2>12. Miljövänliga fraktalternativ</h2>
                <p>
                  Vi erbjuder klimatkompenserad frakt i samarbete med våra fraktpartners.
                  Du kan välja detta alternativ vid kassan för en liten extraavgift (10-15 kr).
                  Vi arbetar kontinuerligt för att minska vårt miljöavtryck.
                </p>

                <h2>13. Kontakta oss</h2>
                <p>
                  Vid frågor om frakt och leverans, kontakta oss:<br />
                  E-post: info@fortuneessence.se<br />
                  Telefon: +46 12 345 67 89<br />
                  Öppettider: Mån-Fre 9:00-17:00
                </p>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-sage-50 border border-sage-200 rounded-2xl">
                    <h3 className="font-semibold text-forest-800 mb-3 flex items-center gap-2">
                      <TruckIcon className="h-5 w-5 text-sage-600" />
                      Snabb leverans
                    </h3>
                    <p className="text-sm text-forest-700">
                      Beställ innan kl. 14:00 för att få ditt paket skickat samma dag.
                      Expressleverans tillgänglig för brådskande beställningar.
                    </p>
                  </div>

                  <div className="p-6 bg-sage-50 border border-sage-200 rounded-2xl">
                    <h3 className="font-semibold text-forest-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      Spårning inkluderat
                    </h3>
                    <p className="text-sm text-forest-700">
                      Följ ditt paket hela vägen med vårt spårningssystem.
                      Du får automatiska uppdateringar via e-post.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2>1. Delivery Area</h2>
                <p>
                  We currently deliver throughout Sweden. Delivery to other countries is planned
                  to be introduced in the future. Contact us if you want delivery outside Sweden.
                </p>

                <h2>2. Delivery Times</h2>
                <p>Normal delivery time is 2-4 business days from when the order has been confirmed and payment has been registered.</p>
                <ul>
                  <li><strong>Stockholm, Gothenburg, Malmö:</strong> 2-3 business days</li>
                  <li><strong>Rest of Sweden:</strong> 3-4 business days</li>
                  <li><strong>Norrland and rural areas:</strong> 4-5 business days</li>
                </ul>
                <p>
                  <em>NOTE:</em> Delivery times are indicative and may be affected by holidays,
                  weekends, and special circumstances.
                </p>

                <h2>3. Shipping Options</h2>

                <h3>PostNord</h3>
                <ul>
                  <li><strong>PostNord Standard:</strong> 49 SEK | 3-4 business days</li>
                  <li><strong>PostNord Parcel:</strong> 69 SEK | 2-3 business days | Tracking</li>
                  <li><strong>PostNord Express:</strong> 129 SEK | 1-2 business days | Tracking</li>
                </ul>

                <h3>DHL</h3>
                <ul>
                  <li><strong>DHL Standard:</strong> 59 SEK | 3-4 business days | Tracking</li>
                  <li><strong>DHL Express:</strong> 149 SEK | 1-2 business days | Tracking</li>
                </ul>

                <h3>Bring</h3>
                <ul>
                  <li><strong>Bring Home Delivery:</strong> 89 SEK | 2-3 business days | Tracking</li>
                  <li><strong>Bring Service Point:</strong> 59 SEK | 2-3 business days | Tracking</li>
                </ul>

                <h2>4. Free Shipping</h2>
                <p>
                  We offer <strong>free shipping on purchases over 500 SEK</strong> within Sweden.
                  Free shipping applies to standard delivery (PostNord or DHL Standard).
                  For faster delivery, an additional fee applies.
                </p>

                <h2>5. Package Tracking</h2>
                <p>
                  When your order has been shipped, you will receive an email with a tracking number.
                  You can track your package by clicking the tracking link in the email or visiting
                  our{' '}
                  <Link href="/orders/track" className="text-sage-700 hover:underline">
                    tracking page
                  </Link>.
                </p>

                <h2>6. Delivery Method</h2>
                <ul>
                  <li><strong>Home Delivery:</strong> Package delivered to your door</li>
                  <li><strong>Pick-up Point:</strong> Pick up package at nearest service point</li>
                  <li><strong>Parcel Box:</strong> Delivery to parcel box (where available)</li>
                </ul>
                <p>
                  You choose delivery method at checkout. Availability may vary depending on
                  your address and chosen shipping option.
                </p>

                <h2>7. Order Processing</h2>
                <p>
                  Orders placed before 2:00 PM on weekdays are processed the same day.
                  Orders placed after 2:00 PM or on weekends are processed the next weekday.
                </p>

                <h2>8. Packaging</h2>
                <p>
                  We pack all products safely and environmentally friendly. Our essential oils
                  are packed with extra protection to avoid spills and damage during transport.
                  We use recyclable packaging materials when possible.
                </p>

                <h2>9. Delayed Delivery</h2>
                <p>
                  If your package has not arrived within the specified delivery time, please contact us.
                  We will help you track the package and find a solution. In case of significant
                  delay due to our fault, you are entitled to compensation according to the Consumer Sales Act.
                </p>

                <h2>10. Damaged Packages</h2>
                <p>
                  If the package is damaged when you receive it:
                </p>
                <ul>
                  <li>Take pictures of the damage and packaging</li>
                  <li>Contact us within 48 hours at info@fortuneessence.se</li>
                  <li>Keep the product and packaging until the matter is resolved</li>
                </ul>
                <p>
                  We will send a new product or refund you at no extra cost.
                </p>

                <h2>11. Package Pick-up</h2>
                <p>
                  If you do not pick up your package at the service point within the specified time
                  (usually 14 days), the package is returned to us. You will then be charged for
                  return shipping (approximately 69-99 SEK) and we will refund the remaining amount.
                </p>

                <h2>12. Eco-Friendly Shipping Options</h2>
                <p>
                  We offer climate-compensated shipping in partnership with our carriers.
                  You can choose this option at checkout for a small extra fee (10-15 SEK).
                  We continuously work to reduce our environmental footprint.
                </p>

                <h2>13. Contact Us</h2>
                <p>
                  For questions about shipping and delivery, contact us:<br />
                  Email: info@fortuneessence.se<br />
                  Phone: +46 12 345 67 89<br />
                  Hours: Mon-Fri 9:00-17:00
                </p>

                <div className="mt-8 grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-sage-50 border border-sage-200 rounded-2xl">
                    <h3 className="font-semibold text-forest-800 mb-3 flex items-center gap-2">
                      <TruckIcon className="h-5 w-5 text-sage-600" />
                      Fast Delivery
                    </h3>
                    <p className="text-sm text-forest-700">
                      Order before 2:00 PM to get your package shipped the same day.
                      Express delivery available for urgent orders.
                    </p>
                  </div>

                  <div className="p-6 bg-sage-50 border border-sage-200 rounded-2xl">
                    <h3 className="font-semibold text-forest-800 mb-3 flex items-center gap-2">
                      <span className="text-xl">📦</span>
                      Tracking Included
                    </h3>
                    <p className="text-sm text-forest-700">
                      Track your package all the way with our tracking system.
                      You get automatic updates via email.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
