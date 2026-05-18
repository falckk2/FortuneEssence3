<script lang="ts">
	import { locale } from '$lib/stores/locale';

	let openIndex = -1;

	const faqs = {
		sv: [
			{ q: 'Är era oljor 100% naturliga?', a: 'Ja, alla våra eteriska oljor är 100% naturliga och fria från konstgjorda tillsatser eller kemikalier.' },
			{ q: 'Hur använder jag eteriska oljor?', a: 'Eteriska oljor kan användas i diffusers, blandas med bäraroljor för massage, tillsättas i bad eller inhaleras direkt från flaskan.' },
			{ q: 'Är det säkert att använda oljor på huden?', a: 'Eteriska oljor bör alltid spädas ut med en bärarolja (t.ex. kokosolja) innan påläggning på huden. Testa alltid på ett litet hudområde först.' },
			{ q: 'Hur lång tid tar leveransen?', a: 'Standard leverans tar 2–4 arbetsdagar i Sverige. Vi erbjuder även expressfrakt på 1–2 arbetsdagar.' },
			{ q: 'Kan jag returnera produkter?', a: 'Ja, vi erbjuder 14 dagars ångerrätt. Produkten måste vara oanvänd och i originalförpackning. Kontakta oss för returinstruktioner.' },
		],
		en: [
			{ q: 'Are your oils 100% natural?', a: 'Yes, all our essential oils are 100% natural and free from artificial additives or chemicals.' },
			{ q: 'How do I use essential oils?', a: 'Essential oils can be used in diffusers, mixed with carrier oils for massage, added to baths, or inhaled directly from the bottle.' },
			{ q: 'Is it safe to use oils on skin?', a: 'Essential oils should always be diluted with a carrier oil (e.g. coconut oil) before applying to skin. Always test on a small area first.' },
			{ q: 'How long does delivery take?', a: 'Standard delivery takes 2–4 business days in Sweden. We also offer express shipping in 1–2 business days.' },
			{ q: 'Can I return products?', a: 'Yes, we offer a 14-day return policy. The product must be unused and in original packaging. Contact us for return instructions.' },
		],
	};
</script>

<svelte:head><title>FAQ – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-16">
	<div class="container mx-auto px-4 max-w-3xl">
		<h1 class="text-4xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-4">FAQ</h1>
		<p class="text-forest-600 dark:text-[#B8C5B8] mb-12">{$locale === 'sv' ? 'Vanliga frågor och svar' : 'Frequently asked questions'}</p>

		<div class="space-y-3">
			{#each faqs[$locale] as faq, i}
				<div class="bg-white dark:bg-[#2a3330] rounded-2xl overflow-hidden shadow-soft">
					<button
						on:click={() => openIndex = openIndex === i ? -1 : i}
						class="w-full flex items-center justify-between px-6 py-4 text-left font-medium text-forest-800 dark:text-[#E8EDE8] hover:bg-cream-50 dark:hover:bg-[#343c39] transition-colors"
					>
						{faq.q}
						<span class="ml-4 text-sage-600 flex-shrink-0 transition-transform {openIndex === i ? 'rotate-45' : ''}">+</span>
					</button>
					{#if openIndex === i}
						<div class="px-6 pb-5 text-forest-600 dark:text-[#B8C5B8]">{faq.a}</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
