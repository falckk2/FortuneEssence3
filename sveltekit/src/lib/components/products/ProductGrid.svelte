<script lang="ts">
	import type { Product } from '$lib/types';
	import ProductCard from './ProductCard.svelte';

	export let products: Product[] = [];
	export let locale: 'sv' | 'en' = 'sv';
	export let className = '';
	export let emptyMessage = '';
</script>

{#if products.length === 0}
	<div class="text-center py-16 text-forest-600 dark:text-[#8A9A8A]">
		{emptyMessage || (locale === 'sv' ? 'Inga produkter hittades' : 'No products found')}
	</div>
{:else}
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 {className}">
		{#each products as product (product.id)}
			<ProductCard {product} {locale} />
		{/each}
	</div>
{/if}
