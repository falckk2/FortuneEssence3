<script lang="ts">
	import { locale } from '$lib/stores/locale';
</script>

<svelte:head><title>{$locale === 'sv' ? 'Fraktpolicy' : 'Shipping Policy'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-16">
	<div class="container mx-auto px-4 max-w-3xl">
		<h1 class="text-4xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-8">
			{$locale === 'sv' ? 'Fraktpolicy' : 'Shipping Policy'}
		</h1>
		<div class="space-y-6 text-forest-700 dark:text-[#B8C5B8]">
			<div class="bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-2xl p-5">
				<p class="font-semibold text-sage-700 dark:text-sage-300">{$locale === 'sv' ? '🚚 Fri frakt på beställningar över 500 kr' : '🚚 Free shipping on orders over 500 SEK'}</p>
			</div>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Leveranstider' : 'Delivery times'}</h2>
			<ul class="space-y-2">
				<li class="flex justify-between"><span>{$locale === 'sv' ? 'Sverige (standard)' : 'Sweden (standard)'}</span><span class="font-medium">2–4 {$locale === 'sv' ? 'arbetsdagar' : 'business days'}</span></li>
				<li class="flex justify-between"><span>{$locale === 'sv' ? 'Sverige (express)' : 'Sweden (express)'}</span><span class="font-medium">1–2 {$locale === 'sv' ? 'arbetsdagar' : 'business days'}</span></li>
			</ul>
			<h2 class="text-2xl font-semibold text-forest-800 dark:text-[#E8EDE8] mt-8">{$locale === 'sv' ? 'Fraktkostnader' : 'Shipping costs'}</h2>
			<ul class="space-y-2">
				<li class="flex justify-between"><span>{$locale === 'sv' ? 'Under 500 kr' : 'Under 500 SEK'}</span><span class="font-medium">49 kr</span></li>
				<li class="flex justify-between"><span>{$locale === 'sv' ? 'Över 500 kr' : 'Over 500 SEK'}</span><span class="font-medium text-sage-600">{$locale === 'sv' ? 'Gratis' : 'Free'}</span></li>
			</ul>
		</div>
	</div>
</div>
