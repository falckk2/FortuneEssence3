'use client';

import {
  SparklesIcon,
  BeakerIcon,
  FireIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

export default function HowToUsePage() {
  const locale = 'sv'; // This would come from context in a real app

  const usageMethods = [
    {
      icon: SparklesIcon,
      title: locale === 'sv' ? 'Doftspridare/Aromadiffuser' : 'Aromadiffuser',
      description: locale === 'sv'
        ? 'Det populäraste sättet att njuta av eteriska oljor. Tillsätt 3-5 droppar i din doftspridare med vatten för att skapa en lugnande atmosfär i ditt hem.'
        : 'The most popular way to enjoy essential oils. Add 3-5 drops to your diffuser with water to create a calming atmosphere in your home.',
      steps: locale === 'sv'
        ? [
            'Fyll doftspridaren med vatten enligt tillverkarens instruktioner',
            'Tillsätt 3-5 droppar (beroende på diffuserns storlek) av eterisk olja',
            'Slå på doftspridaren och njut av doften i 30-60 minuter',
            'Rengör doftspridaren regelbundet för bästa resultat',
          ]
        : [
            'Fill the diffuser with water according to manufacturer instructions',
            'Add 3-5 drops (depending on the size of the diffuser) of essential oil',
            'Turn on the diffuser and enjoy the scent for 30-60 minutes',
            'Clean the diffuser regularly for best results',
          ],
    },
    {
      icon: HandRaisedIcon,
      title: locale === 'sv' ? 'Topisk Applicering/Massage' : 'Topical Application/Massage',
      description: locale === 'sv'
        ? 'Applicera på huden för massage eller hudvård. Späd alltid eteriska oljor med bärarolja.'
        : 'Apply to skin for massage or skincare. Always dilute essential oils with a carrier oil.',
      steps: locale === 'sv'
        ? [
            'Blanda 2-5 droppar eterisk olja med 1 matsked bärarolja beroende på önskad styrka',
            'Gör ett lapptest på insidan av armen först',
            'Massera försiktigt in blandningen på det önskade området',
            'Undvik känsliga områden som ögon och slemhinnor',
          ]
        : [
            'Mix 2-5 drops of essential oil with 1 tablespoon of carrier oil depending on desired potency',
            'Do a patch test on the inside of your arm first',
            'Gently massage the blend into the desired area',
            'Avoid sensitive areas like eyes and mucous membranes',
          ],
    },
    {
      icon: BeakerIcon,
      title: locale === 'sv' ? 'Badtillsats' : 'Bath Addition',
      description: locale === 'sv'
        ? 'Förvandla ditt bad till ett spa-upplevelse. Tillsätt eteriska oljor till ett varmt bad för avslappning och välbefinnande.'
        : 'Transform your bath into a spa experience. Add essential oils to a warm bath for relaxation and well-being.',
      steps: locale === 'sv'
        ? [
            'Fyll badkaret med varmt vatten',
            'Blanda 5-12 droppar eterisk olja med 1-2 matsked(ar) bärarolja eller mjölk',
            'Tillsätt blandningen till badet och rör om',
            'Blöt i badet i 15-20 minuter för maximal effekt',
            'Tips: Använd en badbomb eller dispersant som såpa för att hjälpa oljan att spridas i vattnet',
          ]
        : [
            'Fill the bathtub with warm water',
            'Mix 5-12 drops of essential oil with 1-2 tablespoon(s) of carrier oil or milk',
            'Add the mixture to the bath and stir',
            'Soak in the bath for 15-20 minutes for maximum effect',
            'Tip: Use a bath bomb or dispersant like soap to help the oil spread in the water',
          ],
    },
    {
      icon: FireIcon,
      title: locale === 'sv' ? 'Direkt Inhalering' : 'Direct Inhalation',
      description: locale === 'sv'
        ? 'För snabb lindring och direkta fördelar. Andas in doften direkt från flaskan eller händerna.'
        : 'For quick relief and immediate benefits. Breathe in the scent directly from the bottle or your hands.',
      steps: locale === 'sv'
        ? [
            'Öppna flaskan och håll den några centimeter från näsan',
            'Andas in djupt 2-3 gånger',
            'Alternativt: droppa på händerna, gnugga ihop och andas in',
            'Perfekt för snabb stressavlastning eller energiboost',
          ]
        : [
            'Open the bottle and hold it a few inches from your nose',
            'Breathe in deeply 2-3 times',
            'Alternatively: drop on hands, rub together and inhale',
            'Perfect for quick stress relief or energy boost',
          ],
    },
  ];

  const safetyTips = locale === 'sv'
    ? [
        'Späd alltid eteriska oljor innan applicering på huden',
        'Undvik kontakt med ögon, öron och slemhinnor',
        'Vissa oljor kan vara fotosensibiliserande - undvik sol efter användning',
        'Konsultera läkare om du är gravid, ammar eller har medicinska tillstånd',
        'Förvara utom räckhåll för barn och husdjur',
        'Använd inte internt om det inte är specifikt rekommenderat',
        'Gör alltid ett lapptest innan första användningen',
        'Köp endast från pålitliga källor för garanterad kvalitet',
      ]
    : [
        'Always dilute essential oils before applying to skin',
        'Avoid contact with eyes, ears, and mucous membranes',
        'Some oils can be photosensitizing - avoid sun after use',
        'Consult a doctor if pregnant, nursing, or have medical conditions',
        'Keep out of reach of children and pets',
        'Do not use internally unless specifically recommended',
        'Always do a patch test before first use',
        'Only buy from trusted sources for guaranteed quality',
      ];

  const popularBlends = [
    {
      name: locale === 'sv' ? 'Avslappning' : 'Relaxation',
      oils: locale === 'sv' ? 'Lavendel' : 'Lavender',
      use: locale === 'sv' ? 'Perfekt för kvällen eller innan sänggåendet' : 'Perfect for evenings or before bedtime',
    },
  ];

  // TODO: Uncomment when we have more oils available
  // {
  //   name: locale === 'sv' ? 'Energi' : 'Energy',
  //   oils: locale === 'sv' ? 'Citron, Pepparmynta, Rosmarin' : 'Lemon, Peppermint, Rosemary',
  //   use: locale === 'sv' ? 'Ge dig en boost på morgonen eller mitt på dagen' : 'Give yourself a boost in the morning or midday',
  // },
  // {
  //   name: locale === 'sv' ? 'Fokus' : 'Focus',
  //   oils: locale === 'sv' ? 'Eucalyptus, Rosmarin, Basilika' : 'Eucalyptus, Rosemary, Basil',
  //   use: locale === 'sv' ? 'Hjälper koncentration under arbete eller studier' : 'Helps concentration during work or study',
  // },
  // {
  //   name: locale === 'sv' ? 'Rengöring' : 'Cleansing',
  //   oils: locale === 'sv' ? 'Tea Tree, Citron, Eucalyptus' : 'Tea Tree, Lemon, Eucalyptus',
  //   use: locale === 'sv' ? 'Fräscha upp luften och rengör ytor' : 'Freshen the air and clean surfaces',
  // },

  const carrierOils = [
    {
      name: locale === 'sv' ? 'Mandelolja (Sweet Almond)' : 'Sweet Almond Oil',
      benefits: locale === 'sv'
        ? 'Mild och näringsrik, perfekt för alla hudtyper. Rik på vitamin E och absorberas lätt.'
        : 'Mild and nourishing, perfect for all skin types. Rich in vitamin E and absorbs easily.',
      bestFor: locale === 'sv'
        ? 'Massage, torr hud, känslig hud'
        : 'Massage, dry skin, sensitive skin',
    },
    {
      name: locale === 'sv' ? 'Jojobaolja' : 'Jojoba Oil',
      benefits: locale === 'sv'
        ? 'Liknar hudens naturliga talg, balanserar oljeproduktion. Långvarig och oxiderar inte lätt.'
        : 'Resembles skin\'s natural sebum, balances oil production. Long-lasting and doesn\'t oxidize easily.',
      bestFor: locale === 'sv'
        ? 'Ansiktsvård, fet/kombinerad hud, hårvård'
        : 'Facial care, oily/combination skin, hair care',
    },
    {
      name: locale === 'sv' ? 'Kokosolja (Fraktionerad)' : 'Fractionated Coconut Oil',
      benefits: locale === 'sv'
        ? 'Lättviktig och färglös, stannar flytande i alla temperaturer. Absorberas snabbt utan att kännas oljig.'
        : 'Lightweight and colorless, stays liquid in all temperatures. Absorbs quickly without feeling greasy.',
      bestFor: locale === 'sv'
        ? 'Aromaterapi, massage, alla hudtyper'
        : 'Aromatherapy, massage, all skin types',
    },
    {
      name: locale === 'sv' ? 'Druvkärnsolja (Grapeseed)' : 'Grapeseed Oil',
      benefits: locale === 'sv'
        ? 'Lätt konsistens, rik på antioxidanter. Innehåller linolsyra som stärker hudbarriären.'
        : 'Light consistency, rich in antioxidants. Contains linoleic acid that strengthens skin barrier.',
      bestFor: locale === 'sv'
        ? 'Fet hud, aknebenägen hud, snabb absorption'
        : 'Oily skin, acne-prone skin, quick absorption',
    },
    {
      name: locale === 'sv' ? 'Avokadoolja' : 'Avocado Oil',
      benefits: locale === 'sv'
        ? 'Mycket näringsrik och tjock, rik på A-, D- och E-vitamin. Penetrerar djupt i huden.'
        : 'Very nourishing and thick, rich in vitamins A, D, and E. Penetrates deeply into skin.',
      bestFor: locale === 'sv'
        ? 'Torr/mogen hud, djup återfuktning, eksembenägen hud'
        : 'Dry/mature skin, deep moisturizing, eczema-prone skin',
    },
    {
      name: locale === 'sv' ? 'Arganolja' : 'Argan Oil',
      benefits: locale === 'sv'
        ? 'Lyxig och lätt, kallad "flytande guld". Hög halt av vitamin E och essentiella fettsyror.'
        : 'Luxurious and light, called "liquid gold". High in vitamin E and essential fatty acids.',
      bestFor: locale === 'sv'
        ? 'Anti-aging, hårvård, nagelband, alla hudtyper'
        : 'Anti-aging, hair care, cuticles, all skin types',
    },
    {
      name: locale === 'sv' ? 'Olivolja (Extra Virgin)' : 'Olive Oil (Extra Virgin)',
      benefits: locale === 'sv'
        ? 'Rik på antioxidanter och squalen. Tjock konsistens som skyddar och återfuktar huden.'
        : 'Rich in antioxidants and squalene. Thick consistency that protects and moisturizes skin.',
      bestFor: locale === 'sv'
        ? 'Torr hud, mogen hud, massageolja (blandas med lättare oljor)'
        : 'Dry skin, mature skin, massage oil (mix with lighter oils)',
    },
    {
      name: locale === 'sv' ? 'Aprikoskärnolja' : 'Apricot Kernel Oil',
      benefits: locale === 'sv'
        ? 'Lätt och silkeslen, absorberas snabbt. Rik på vitaminer A och E, mjukgör och vårdar huden.'
        : 'Light and silky, absorbs quickly. Rich in vitamins A and E, softens and nourishes skin.',
      bestFor: locale === 'sv'
        ? 'Känslig hud, ansiktsvård, babymassage, mogen hud'
        : 'Sensitive skin, facial care, baby massage, mature skin',
    },
    {
      name: locale === 'sv' ? 'Solrosolja' : 'Sunflower Oil',
      benefits: locale === 'sv'
        ? 'Lätt och prisvärd, naturligt hög i vitamin E. Stärker hudbarriären och lugnar irritation.'
        : 'Light and affordable, naturally high in vitamin E. Strengthens skin barrier and soothes irritation.',
      bestFor: locale === 'sv'
        ? 'Känslig hud, ekonomiskt val, generell massage'
        : 'Sensitive skin, economical choice, general massage',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sage-100 via-cream-100 to-sage-50 dark:from-[#1a1f1e] dark:via-[#242a28] dark:to-[#2a3330] py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--sage-light)_0%,_transparent_50%)]"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-forest-700 dark:text-[#E8EDE8] mb-6">
              {locale === 'sv' ? 'Instruktioner' : 'Essential Oil Guide'}
            </h1>
            <p className="text-xl text-forest-600 dark:text-[#B8C5B8] leading-relaxed">
              {locale === 'sv'
                ? 'Upptäck de bästa metoderna för att njuta av dina eteriska oljor säkert och effektivt'
                : 'Discover the best methods to enjoy your essential oils safely and effectively'}
            </p>
          </div>
        </div>
      </section>

      {/* Usage Methods Section */}
      <section className="py-20 bg-white dark:bg-[#242a28]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-700 dark:text-[#F0F5F0] mb-4">
              {locale === 'sv' ? 'Användningsmetoder' : 'Usage Methods'}
            </h2>
            <p className="text-lg text-forest-600 dark:text-[#C5D4C5] max-w-2xl mx-auto">
              {locale === 'sv'
                ? 'Välj den metod som passar dina behov och preferenser bäst'
                : 'Choose the method that best suits your needs and preferences'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {usageMethods.map((method, index) => (
              <div
                key={index}
                className="bg-cream-50 dark:bg-[#2a3330] rounded-2xl p-8 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-14 h-14 bg-sage-100 dark:bg-[#3f4946] rounded-full flex items-center justify-center">
                    <method.icon className="h-7 w-7 text-sage-600 dark:text-sage-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-forest-700 dark:text-[#E8EDE8] mb-2">
                      {method.title}
                    </h3>
                    <p className="text-forest-600 dark:text-[#C5D4C5]">
                      {method.description}
                    </p>
                  </div>
                </div>
                <div className="ml-18 pl-4 border-l-2 border-sage-300 dark:border-sage-700">
                  <h4 className="text-sm font-semibold text-sage-700 dark:text-sage-400 mb-3 uppercase tracking-wide">
                    {locale === 'sv' ? 'Steg för steg' : 'Step by Step'}
                  </h4>
                  <ol className="space-y-2">
                    {method.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3 text-forest-600 dark:text-[#B8C5B8]">
                        <span className="flex-shrink-0 w-6 h-6 bg-sage-200 dark:bg-[#4a5552] text-sage-700 dark:text-sage-300 rounded-full flex items-center justify-center text-xs font-semibold">
                          {stepIndex + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Carrier Oils Section */}
      <section className="py-20 bg-cream-50 dark:bg-[#1a1f1e]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sage-100 dark:bg-[#3f4946] rounded-full mb-4">
              <HeartIcon className="h-8 w-8 text-sage-600 dark:text-sage-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-700 dark:text-[#F0F5F0] mb-4">
              {locale === 'sv' ? 'Bäraroljor' : 'Carrier Oils'}
            </h2>
            <p className="text-lg text-forest-600 dark:text-[#C5D4C5] max-w-2xl mx-auto">
              {locale === 'sv'
                ? 'Eteriska oljor ska alltid spädes med en bärarolja innan applicering på huden. Här är de mest populära bäraroljorna och deras unika egenskaper.'
                : 'Essential oils should always be diluted with a carrier oil before applying to skin. Here are the most popular carrier oils and their unique properties.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {carrierOils.map((oil, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-xl font-semibold text-forest-700 dark:text-[#E8EDE8] mb-3">
                  {oil.name}
                </h3>
                <p className="text-forest-600 dark:text-[#B8C5B8] mb-4 leading-relaxed">
                  {oil.benefits}
                </p>
                <div className="pt-4 border-t border-sage-200 dark:border-sage-800">
                  <p className="text-sm font-semibold text-sage-700 dark:text-sage-400 mb-1">
                    {locale === 'sv' ? 'Bäst för:' : 'Best for:'}
                  </p>
                  <p className="text-sm text-forest-600 dark:text-[#B8C5B8]">
                    {oil.bestFor}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 max-w-4xl mx-auto p-6 bg-sage-50 dark:bg-[#1f2624] border-l-4 border-sage-600 dark:border-sage-500 rounded-r-lg">
            <h4 className="font-semibold text-forest-700 dark:text-[#E8EDE8] mb-2">
              {locale === 'sv' ? 'Spädningsrekommendation:' : 'Dilution Recommendation:'}
            </h4>
            <p className="text-forest-600 dark:text-[#B8C5B8]">
              {locale === 'sv'
                ? 'För normal användning på kroppen: Använd 2-3% utspädning (2-3 droppar eterisk olja per matsked bärarolja). För ansiktet: Använd 1% utspädning (1 droppe per matsked). För barn och känslig hud: Använd 0.5-1% utspädning.'
                : 'For normal body use: Use 2-3% dilution (2-3 drops essential oil per tablespoon carrier oil). For face: Use 1% dilution (1 drop per tablespoon). For children and sensitive skin: Use 0.5-1% dilution.'}
            </p>
          </div>
        </div>
      </section>

      {/* Popular Uses Section */}
      <section className="py-20 bg-white dark:bg-[#242a28]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-700 dark:text-[#F0F5F0] mb-4">
              {locale === 'sv' ? 'Populära Användningar' : 'Popular Uses'}
            </h2>
            <p className="text-lg text-forest-600 dark:text-[#C5D4C5] max-w-2xl mx-auto">
              {locale === 'sv'
                ? 'Upptäck hur du kan använda lavendel för olika behov'
                : 'Discover how you can use lavender for different needs'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto justify-items-center">
            {popularBlends.map((blend, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-1 w-full max-w-sm"
              >
                <h3 className="text-xl font-semibold text-forest-700 dark:text-[#E8EDE8] mb-3">
                  {blend.name}
                </h3>
                <p className="text-sage-600 dark:text-sage-400 font-medium mb-3 text-sm">
                  {blend.oils}
                </p>
                <p className="text-forest-600 dark:text-[#B8C5B8] text-sm">
                  {blend.use}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Tips Section */}
      <section className="py-20 bg-cream-50 dark:bg-[#1a1f1e]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-terracotta-100 dark:bg-[#4a3c38] rounded-full mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-terracotta-600 dark:text-terracotta-400" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-forest-700 dark:text-[#F0F5F0] mb-4">
                {locale === 'sv' ? 'Säkerhetstips' : 'Safety Tips'}
              </h2>
              <p className="text-lg text-forest-600 dark:text-[#C5D4C5]">
                {locale === 'sv'
                  ? 'Följ dessa riktlinjer för säker användning av eteriska oljor'
                  : 'Follow these guidelines for safe use of essential oils'}
              </p>
            </div>

            <div className="bg-cream-50 dark:bg-[#2a3330] rounded-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safetyTips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-terracotta-600 dark:text-terracotta-400 flex-shrink-0 mt-0.5" />
                    <p className="text-forest-600 dark:text-[#B8C5B8]">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 p-6 bg-sage-50 dark:bg-[#1f2624] border-l-4 border-sage-600 dark:border-sage-500 rounded-r-lg">
              <p className="text-forest-700 dark:text-[#E8EDE8] font-medium">
                {locale === 'sv'
                  ? 'Om du upplever irritation, allergisk reaktion eller annan biverkning, sluta använda produkten omedelbart och konsultera läkare vid behov.'
                  : 'If you experience irritation, allergic reaction, or other side effects, stop using the product immediately and consult a doctor if needed.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
