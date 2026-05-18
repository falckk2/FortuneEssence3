<script lang="ts">
	import { locale } from '$lib/stores/locale';
</script>

<svelte:head><title>{$locale === 'sv' ? 'Användarvillkor' : 'Terms of Service'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-16">
	<div class="container mx-auto px-4 max-w-3xl">
		<h1 class="text-4xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-8">
			{$locale === 'sv' ? 'Användarvillkor' : 'Terms of Service'}
		</h1>
		<div class="space-y-6 text-forest-700 dark:text-[#B8C5B8]">
			<p>{$locale === 'sv' ? 'Genom att använda vår webbplats accepterar du dessa villkor.' : 'By using our website, you accept these terms.'}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Beställningar' : 'Orders'}</h2>
			<p>{$locale === 'sv' ? 'Alla beställningar bekräftas via e-post. Vi förbehåller oss rätten att avböja beställningar vid exceptionella omständigheter.' : 'All orders are confirmed via email. We reserve the right to decline orders under exceptional circumstances.'}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Retur & Reklamation' : 'Returns & Complaints'}</h2>
			<p>{$locale === 'sv' ? 'Du har 14 dagars ångerrätt. Kontakta oss på info@fortuneessence.se för returinstruktioner.' : 'You have 14 days right of return. Contact us at info@fortuneessence.se for return instructions.'}</p>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Priser' : 'Prices'}</h2>
			<p>{$locale === 'sv' ? 'Alla priser anges inklusive moms. Vi förbehåller oss rätten att ändra priser utan förvarning.' : 'All prices include VAT. We reserve the right to change prices without notice.'}</p>
		</div>
	</div>
</div>
