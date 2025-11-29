import Link from 'next/link';
import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function PrivacyPage() {
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
              <ShieldCheckIcon className="h-6 w-6 text-sage-600" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-800">
              {locale === 'sv' ? 'Integritetspolicy' : 'Privacy Policy'}
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
                <h2>1. Introduktion</h2>
                <p>
                  Fortune Essence värnar om din integritet och skyddet av dina personuppgifter.
                  Denna integritetspolicy beskriver hur vi samlar in, använder och skyddar dina
                  personuppgifter i enlighet med EU:s dataskyddsförordning (GDPR) och svensk
                  dataskyddslagstiftning.
                </p>

                <h2>2. Personuppgiftsansvarig</h2>
                <p>
                  Fortune Essence är personuppgiftsansvarig för behandlingen av dina personuppgifter.<br />
                  E-post: info@fortuneessence.se<br />
                  Adress: Stockholm, Sverige
                </p>

                <h2>3. Vilka personuppgifter samlar vi in?</h2>
                <p>Vi samlar in följande typer av personuppgifter:</p>
                <ul>
                  <li><strong>Kontaktuppgifter:</strong> Namn, e-postadress, telefonnummer, leveransadress</li>
                  <li><strong>Köpinformation:</strong> Orderhistorik, betalningsmetod, faktureringsadress</li>
                  <li><strong>Teknisk information:</strong> IP-adress, webbläsartyp, besökta sidor</li>
                  <li><strong>Kommunikation:</strong> Meddelanden du skickar till vår kundservice</li>
                  <li><strong>Marknadsföring:</strong> Nyhetsbrevsprenumerationer och preferenser</li>
                </ul>

                <h2>4. Hur använder vi dina personuppgifter?</h2>
                <p>Vi använder dina personuppgifter för att:</p>
                <ul>
                  <li>Behandla och leverera dina beställningar</li>
                  <li>Kommunicera med dig om din order och leveransstatus</li>
                  <li>Hantera betalningar och fakturering</li>
                  <li>Tillhandahålla kundservice och support</li>
                  <li>Förbättra vår webbplats och tjänster</li>
                  <li>Skicka marknadsföring och nyhetsbrev (med ditt samtycke)</li>
                  <li>Följa lagkrav och förebygga bedrägerier</li>
                </ul>

                <h2>5. Rättslig grund för behandling</h2>
                <p>Vi behandlar dina personuppgifter baserat på:</p>
                <ul>
                  <li><strong>Avtal:</strong> För att fullgöra vårt avtal med dig (orderhantering, leverans)</li>
                  <li><strong>Samtycke:</strong> För marknadsföring och nyhetsbrev</li>
                  <li><strong>Berättigat intresse:</strong> För att förbättra våra tjänster och säkerhet</li>
                  <li><strong>Laglig förpliktelse:</strong> För bokföring och skatteändamål</li>
                </ul>

                <h2>6. Delning av personuppgifter</h2>
                <p>Vi delar dina personuppgifter med:</p>
                <ul>
                  <li><strong>Leverantörer:</strong> PostNord, DHL, Bring för leverans</li>
                  <li><strong>Betaltjänster:</strong> Stripe, Klarna, Swish för betalningshantering</li>
                  <li><strong>IT-leverantörer:</strong> Hosting och databashantering</li>
                  <li><strong>Myndigheter:</strong> Vid lagkrav</li>
                </ul>
                <p>
                  Vi säkerställer att alla tredje parter följer GDPR och har lämpliga säkerhetsåtgärder.
                </p>

                <h2>7. Lagring av personuppgifter</h2>
                <p>
                  Vi lagrar dina personuppgifter så länge det är nödvändigt för de ändamål de samlades in:
                </p>
                <ul>
                  <li><strong>Kundkonto:</strong> Tills du begär radering</li>
                  <li><strong>Orderhistorik:</strong> 7 år (bokföringskrav)</li>
                  <li><strong>Marknadsföring:</strong> Tills du avanmäler dig</li>
                  <li><strong>Webbanalys:</strong> 26 månader</li>
                </ul>

                <h2>8. Dina rättigheter enligt GDPR</h2>
                <p>Du har följande rättigheter:</p>
                <ul>
                  <li><strong>Rätt till tillgång:</strong> Begära kopia av dina personuppgifter</li>
                  <li><strong>Rätt till rättelse:</strong> Korrigera felaktiga uppgifter</li>
                  <li><strong>Rätt till radering:</strong> Begära att vi raderar dina uppgifter</li>
                  <li><strong>Rätt till begränsning:</strong> Begränsa behandlingen av dina uppgifter</li>
                  <li><strong>Rätt till dataportabilitet:</strong> Få dina uppgifter i ett strukturerat format</li>
                  <li><strong>Rätt att invända:</strong> Invända mot viss behandling</li>
                  <li><strong>Rätt att återkalla samtycke:</strong> När som helst</li>
                </ul>
                <p>
                  För att utöva dina rättigheter, besök{' '}
                  <Link href="/account/privacy" className="text-sage-700 hover:underline">
                    GDPR-inställningar
                  </Link>
                  {' '}eller kontakta oss på info@fortuneessence.se.
                </p>

                <h2>9. Cookies</h2>
                <p>
                  Vi använder cookies för att förbättra din upplevelse på vår webbplats. Cookies
                  används för sessionshantering, analys och marknadsföring. Du kan hantera
                  cookie-inställningar i din webbläsare.
                </p>

                <h2>10. Säkerhet</h2>
                <p>
                  Vi använder tekniska och organisatoriska säkerhetsåtgärder för att skydda dina
                  personuppgifter mot obehörig åtkomst, förlust eller missbruk. Detta inkluderar
                  kryptering, säkra servrar och regelbundna säkerhetsgranskningar.
                </p>

                <h2>11. Ändringar av integritetspolicyn</h2>
                <p>
                  Vi kan uppdatera denna integritetspolicy. Väsentliga ändringar meddelas via
                  e-post eller på vår webbplats.
                </p>

                <h2>12. Klagomål</h2>
                <p>
                  Om du har klagomål om hur vi behandlar dina personuppgifter kan du kontakta
                  Integritetsskyddsmyndigheten (IMY).
                </p>

                <h2>13. Kontakta oss</h2>
                <p>
                  Vid frågor om vår integritetspolicy, kontakta oss:<br />
                  E-post: info@fortuneessence.se<br />
                  Telefon: +46 12 345 67 89
                </p>
              </>
            ) : (
              <>
                <h2>1. Introduction</h2>
                <p>
                  Fortune Essence values your privacy and the protection of your personal data.
                  This privacy policy describes how we collect, use, and protect your personal
                  data in accordance with the EU General Data Protection Regulation (GDPR) and
                  Swedish data protection legislation.
                </p>

                <h2>2. Data Controller</h2>
                <p>
                  Fortune Essence is the data controller for the processing of your personal data.<br />
                  Email: info@fortuneessence.se<br />
                  Address: Stockholm, Sweden
                </p>

                <h2>3. What Personal Data Do We Collect?</h2>
                <p>We collect the following types of personal data:</p>
                <ul>
                  <li><strong>Contact Information:</strong> Name, email address, phone number, delivery address</li>
                  <li><strong>Purchase Information:</strong> Order history, payment method, billing address</li>
                  <li><strong>Technical Information:</strong> IP address, browser type, pages visited</li>
                  <li><strong>Communication:</strong> Messages you send to our customer service</li>
                  <li><strong>Marketing:</strong> Newsletter subscriptions and preferences</li>
                </ul>

                <h2>4. How Do We Use Your Personal Data?</h2>
                <p>We use your personal data to:</p>
                <ul>
                  <li>Process and deliver your orders</li>
                  <li>Communicate with you about your order and delivery status</li>
                  <li>Handle payments and billing</li>
                  <li>Provide customer service and support</li>
                  <li>Improve our website and services</li>
                  <li>Send marketing and newsletters (with your consent)</li>
                  <li>Comply with legal requirements and prevent fraud</li>
                </ul>

                <h2>5. Legal Basis for Processing</h2>
                <p>We process your personal data based on:</p>
                <ul>
                  <li><strong>Contract:</strong> To fulfill our agreement with you (order processing, delivery)</li>
                  <li><strong>Consent:</strong> For marketing and newsletters</li>
                  <li><strong>Legitimate Interest:</strong> To improve our services and security</li>
                  <li><strong>Legal Obligation:</strong> For accounting and tax purposes</li>
                </ul>

                <h2>6. Sharing of Personal Data</h2>
                <p>We share your personal data with:</p>
                <ul>
                  <li><strong>Carriers:</strong> PostNord, DHL, Bring for delivery</li>
                  <li><strong>Payment Services:</strong> Stripe, Klarna, Swish for payment processing</li>
                  <li><strong>IT Providers:</strong> Hosting and database management</li>
                  <li><strong>Authorities:</strong> When legally required</li>
                </ul>
                <p>
                  We ensure that all third parties comply with GDPR and have appropriate security measures.
                </p>

                <h2>7. Storage of Personal Data</h2>
                <p>
                  We store your personal data as long as necessary for the purposes for which they were collected:
                </p>
                <ul>
                  <li><strong>Customer Account:</strong> Until you request deletion</li>
                  <li><strong>Order History:</strong> 7 years (accounting requirements)</li>
                  <li><strong>Marketing:</strong> Until you unsubscribe</li>
                  <li><strong>Web Analytics:</strong> 26 months</li>
                </ul>

                <h2>8. Your Rights Under GDPR</h2>
                <p>You have the following rights:</p>
                <ul>
                  <li><strong>Right of Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your data</li>
                  <li><strong>Right to Restriction:</strong> Restrict the processing of your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Right to Object:</strong> Object to certain processing</li>
                  <li><strong>Right to Withdraw Consent:</strong> At any time</li>
                </ul>
                <p>
                  To exercise your rights, visit{' '}
                  <Link href="/account/privacy" className="text-sage-700 hover:underline">
                    GDPR Settings
                  </Link>
                  {' '}or contact us at info@fortuneessence.se.
                </p>

                <h2>9. Cookies</h2>
                <p>
                  We use cookies to improve your experience on our website. Cookies are used for
                  session management, analytics, and marketing. You can manage cookie settings
                  in your browser.
                </p>

                <h2>10. Security</h2>
                <p>
                  We use technical and organizational security measures to protect your personal
                  data against unauthorized access, loss, or misuse. This includes encryption,
                  secure servers, and regular security audits.
                </p>

                <h2>11. Changes to Privacy Policy</h2>
                <p>
                  We may update this privacy policy. Significant changes will be communicated via
                  email or on our website.
                </p>

                <h2>12. Complaints</h2>
                <p>
                  If you have complaints about how we process your personal data, you can contact
                  the Swedish Authority for Privacy Protection (IMY).
                </p>

                <h2>13. Contact Us</h2>
                <p>
                  For questions about our privacy policy, contact us:<br />
                  Email: info@fortuneessence.se<br />
                  Phone: +46 12 345 67 89
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
