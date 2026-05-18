<script lang="ts">
	import type { Product } from '$lib/types';

	export let product: Product;
	export let requiredQuantity: number;
	export let discountPercentage: number;
	export let locale: 'sv' | 'en' = 'sv';
</script>

<a href="/products/{product.id}" class="group block bg-white dark:bg-[#2a3330] rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
	<div class="p-6">
		<div class="flex items-center gap-2 mb-3">
			<span class="px-3 py-1 bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 rounded-full text-sm font-medium">
				{locale === 'sv' ? 'Spara' : 'Save'} {discountPercentage}%
			</span>
		</div>
		<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">
			{product.translations[locale]?.name ?? product.name}
		</h3>
		<p class="text-forest-600 dark:text-[#B8C5B8] text-sm mb-4">
			{locale === 'sv' ? `Välj ${requiredQuantity} oljor` : `Choose ${requiredQuantity} oils`}
		</p>
		<div class="flex items-baseline gap-2">
			<span class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">
				{new Intl.NumberFormat(locale === 'sv' ? 'sv-SE' : 'en-US', { style: 'currency', currency: 'SEK' }).format(product.price)}
			</span>
		</div>
		<button class="mt-4 w-full py-2.5 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium transition-colors">
			{locale === 'sv' ? 'Välj oljor' : 'Select oils'}
		</button>
	</div>
</a>
