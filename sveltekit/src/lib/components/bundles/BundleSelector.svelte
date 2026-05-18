<script lang="ts">
	import { onMount } from 'svelte';
	import { cart } from '$lib/stores/cart';
	import { toast } from '$lib/stores/toast';
	import type { Product, BundleConfiguration } from '$lib/types';

	export let bundleProduct: Product;
	export let bundleConfig: BundleConfiguration;
	export let locale: 'sv' | 'en' = 'sv';

	let eligibleProducts: Product[] = [];
	let selectedIds: string[] = [];
	let loading = true;
	let adding = false;

	$: canAdd = selectedIds.length === bundleConfig.requiredQuantity;

	onMount(async () => {
		try {
			const res = await fetch(`/api/bundles/${bundleProduct.id}/eligible-products`);
			const data = await res.json();
			if (data.success) eligibleProducts = data.data;
		} finally {
			loading = false;
		}
	});

	function toggleProduct(id: string) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter(i => i !== id);
		} else if (selectedIds.length < bundleConfig.requiredQuantity) {
			selectedIds = [...selectedIds, id];
		}
	}

	async function addBundle() {
		if (!canAdd) return;
		adding = true;
		try {
			await cart.addItem({ productId: bundleProduct.id, quantity: 1, price: bundleProduct.price, bundleSelectedIds: selectedIds });
			toast.success(locale === 'sv' ? 'Paket tillagt i varukorgen!' : 'Bundle added to cart!');
		} catch {
			toast.error(locale === 'sv' ? 'Kunde inte lägga till' : 'Failed to add');
		} finally {
			adding = false;
		}
	}
</script>

<div class="space-y-4">
	<p class="text-sm text-forest-600 dark:text-[#B8C5B8]">
		{locale === 'sv'
			? `Välj ${bundleConfig.requiredQuantity} oljor (${selectedIds.length}/${bundleConfig.requiredQuantity} valda)`
			: `Choose ${bundleConfig.requiredQuantity} oils (${selectedIds.length}/${bundleConfig.requiredQuantity} selected)`}
	</p>

	{#if loading}
		<div class="grid grid-cols-2 gap-3">
			{#each [1, 2, 3, 4] as _}
				<div class="h-16 bg-cream-200 dark:bg-[#343c39] rounded-xl animate-pulse"></div>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
			{#each eligibleProducts as product (product.id)}
				<button
					on:click={() => toggleProduct(product.id)}
					class="flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all {selectedIds.includes(product.id) ? 'border-sage-600 bg-sage-50 dark:bg-sage-900/20' : 'border-cream-200 dark:border-[#4a5552] hover:border-sage-400'}"
				>
					<div class="w-4 h-4 rounded border-2 flex-shrink-0 {selectedIds.includes(product.id) ? 'bg-sage-600 border-sage-600' : 'border-cream-400 dark:border-[#6B7B6B]'}">
						{#if selectedIds.includes(product.id)}<span class="text-white text-xs leading-none">✓</span>{/if}
					</div>
					<span class="text-xs font-medium text-forest-800 dark:text-[#E8EDE8]">{product.translations[locale]?.name ?? product.name}</span>
				</button>
			{/each}
		</div>
	{/if}

	<button
		on:click={addBundle}
		disabled={!canAdd || adding}
		class="w-full py-4 rounded-full bg-sage-600 hover:bg-sage-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
	>
		{adding ? '...' : (locale === 'sv' ? 'Lägg i varukorg' : 'Add to cart')}
	</button>
</div>
