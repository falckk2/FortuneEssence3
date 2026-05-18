<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { locale } from '$lib/stores/locale';
	import type { Product, BundleConfiguration } from '$lib/types';
	import ProductGrid from '$lib/components/products/ProductGrid.svelte';
	import ProductFilters from '$lib/components/products/ProductFilters.svelte';
	import BundleCard from '$lib/components/bundles/BundleCard.svelte';
	import { Search } from 'lucide-svelte';

	let allProducts: Product[] = [];
	let bundles: Product[] = [];
	let bundleConfigs: Record<string, BundleConfiguration> = {};
	let filteredProducts: Product[] = [];
	let filterOptions = { categories: [] as any[], priceRange: { min: 0, max: 1000 } };
	let filters: Record<string, unknown> = {};
	let searchQuery = '';
	let loading = true;
	let debounceTimer: ReturnType<typeof setTimeout>;

	$: {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => applyFilters(), 300);
	}

	onMount(async () => {
		const q = $page.url.searchParams.get('search');
		if (q) searchQuery = q;
		await fetchData();
	});

	async function fetchData() {
		loading = true;
		try {
			const [productsRes, categoriesRes] = await Promise.all([
				fetch(`/api/products?locale=${$locale}`),
				fetch('/api/products/categories'),
			]);
			const productsData = await productsRes.json();
			const categoriesData = await categoriesRes.json();

			if (productsData.success) {
				bundles = productsData.data.filter((p: Product) => p.category === 'bundles');
				allProducts = productsData.data.filter((p: Product) => p.category !== 'bundles');
				filteredProducts = allProducts;

				if (bundles.length > 0) {
					const bundlesRes = await fetch('/api/bundles');
					const bundlesData = await bundlesRes.json();
					if (bundlesData.success) {
						bundlesData.data.forEach((c: BundleConfiguration) => { bundleConfigs[c.bundleProductId] = c; });
					}
				}

				if (productsData.success && categoriesData.success) {
					const prices = productsData.data.map((p: Product) => p.price);
					filterOptions = { categories: categoriesData.data, priceRange: { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) } };
				}
			}
		} finally { loading = false; }
	}

	function applyFilters() {
		let f = [...allProducts];
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			f = f.filter(p => {
				const name = p.translations[$locale]?.name ?? p.name;
				return name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
			});
		}
		if (filters.category) f = f.filter(p => p.category === filters.category);
		if (filters.inStock) f = f.filter(p => p.stock > 0);
		filteredProducts = f;
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Alla produkter' : 'All products'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-gradient-to-b from-yellow-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28]">
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8] mb-2">{$locale === 'sv' ? 'Alla Produkter' : 'All Products'}</h1>
			<p class="text-forest-600 dark:text-[#B8C5B8]">{$locale === 'sv' ? 'Upptäck vårt fullständiga sortiment av premium eteriska oljor.' : 'Discover our complete range of premium essential oils.'}</p>
		</div>

		<div class="mb-6">
			<div class="relative max-w-md">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={20} class="text-forest-400 dark:text-[#6B7B6B]" /></div>
				<input type="text" bind:value={searchQuery} placeholder={$locale === 'sv' ? 'Sök produkter...' : 'Search products...'}
					class="block w-full pl-10 pr-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded-md bg-white dark:bg-[#2a3330] dark:text-[#E8EDE8] placeholder-forest-500 dark:placeholder-[#6B7B6B] focus:outline-none focus:ring-1 focus:ring-sage-500" />
			</div>
		</div>

		{#if bundles.length > 0}
			<div class="mb-12">
				<h2 class="text-2xl font-serif font-bold text-forest-800 mb-2">{$locale === 'sv' ? 'Spara med våra paket' : 'Save with our bundles'}</h2>
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each bundles as bundle (bundle.id)}
						{@const config = bundleConfigs[bundle.id]}
						{#if config}
							<BundleCard product={bundle} requiredQuantity={config.requiredQuantity} discountPercentage={config.discountPercentage} locale={$locale} />
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<div class="mb-4 text-sm text-forest-700 dark:text-[#C5D4C5]">
			{$locale === 'sv' ? `Visar ${filteredProducts.length} av ${allProducts.length} produkter` : `Showing ${filteredProducts.length} of ${allProducts.length} products`}
		</div>

		{#if loading}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each [1, 2, 3, 4, 5, 6] as _}
					<div class="h-96 bg-cream-300 dark:bg-[#343c39] rounded-2xl animate-pulse"></div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
				<div class="lg:col-span-1">
					<ProductFilters locale={$locale} {filters} options={filterOptions} onFiltersChange={f => { filters = f; applyFilters(); }} className="sticky top-4" />
				</div>
				<div class="lg:col-span-3">
					<ProductGrid products={filteredProducts} locale={$locale}
						emptyMessage={searchQuery ? ($locale === 'sv' ? `Inga produkter för "${searchQuery}"` : `No products for "${searchQuery}"`) : ($locale === 'sv' ? 'Inga produkter matchar' : 'No products match')} />
				</div>
			</div>
		{/if}
	</div>
</div>
