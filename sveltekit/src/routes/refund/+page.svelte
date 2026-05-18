<script lang="ts">
	import { locale } from '$lib/stores/locale';
</script>

<svelte:head><title>{$locale === 'sv' ? 'Returpolicy' : 'Refund Policy'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-16">
	<div class="container mx-auto px-4 max-w-3xl">
		<h1 class="text-4xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-8">
			{$locale === 'sv' ? 'Returpolicy' : 'Refund Policy'}
		</h1>
		<div class="space-y-6 text-forest-700 dark:text-[#B8C5B8]">
			<p>{$locale === 'sv' ? 'Vi vill att du ska vara helt nöjd med ditt köp. Är du inte det, hjälper vi dig.' : "We want you to be completely satisfied with your purchase. If you're not, we'll help you."}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? '14 dagars ångerrätt' : '14-day return policy'}</h2>
			<p>{$locale === 'sv' ? 'Enligt konsumentköplagen har du rätt att returnera produkter inom 14 dagar från mottagandet utan att ange skäl. Produkten ska vara oanvänd och i originalförpackning.' : 'Under consumer protection law, you have the right to return products within 14 days of receipt without stating a reason. The product must be unused and in original packaging.'}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Hur gör du en retur?' : 'How to return?'}</h2>
			<p>{$locale === 'sv' ? '1. Kontakta oss på info@fortuneessence.se\n2. Ange ditt ordernummer och anledning till retur\n3. Vi skickar returinstruktioner\n4. Återbetalning sker inom 14 dagar efter mottagande' : '1. Contact us at info@fortuneessence.se\n2. Provide your order number and reason for return\n3. We send return instructions\n4. Refund within 14 days of receipt'}</p>
		</div>
	</div>
</div>
