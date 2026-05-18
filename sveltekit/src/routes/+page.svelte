<script lang="ts">
	import { onMount } from 'svelte';
	import { locale } from '$lib/stores/locale';
	import type { Product } from '$lib/types';
	import ProductGrid from '$lib/components/products/ProductGrid.svelte';

	let featuredProducts: Product[] = [];
	let loading = true;

	onMount(async () => {
		try {
			const res = await fetch('/api/products/featured');
			const data = await res.json();
			if (data.success) featuredProducts = data.data;
		} finally { loading = false; }
	});
</script>

<svelte:head><title>Fortune Essence – {$locale === 'sv' ? 'Naturliga eteriska oljor' : 'Natural Essential Oils'}</title></svelte:head>

<div class="min-h-screen">
	<!-- Hero -->
	<section class="relative overflow-hidden bg-cream-200 dark:bg-[#1a1f1e] py-24 sm:py-32">
		<div class="absolute inset-0 opacity-30">
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--sage-light)_0%,_transparent_50%)]"></div>
			<div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--terracotta-light)_0%,_transparent_50%)]"></div>
		</div>
		<div class="container mx-auto px-4 relative">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
				<div class="text-left space-y-6">
					<div class="inline-block px-4 py-2 bg-sage-100 dark:bg-sage-900 text-sage-700 dark:text-sage-300 rounded-full text-sm font-medium">
						✨ {$locale === 'sv' ? 'Naturligt välbefinnande' : 'Natural Wellness'}
					</div>
					<h1 class="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-forest-700 dark:text-[#E8EDE8] leading-tight">
						{$locale === 'sv' ? 'Din dagliga dos av välbefinnande' : 'Your daily dose of wellness'}
					</h1>
					<p class="text-xl text-forest-600 dark:text-[#C5D4C5] max-w-lg leading-relaxed">
						{$locale === 'sv' ? 'Naturliga eteriska oljor för det moderna livet. Skapa din egen välmåenderitual.' : 'Natural essential oils for modern life. Create your own wellness ritual.'}
					</p>
					<div class="flex flex-col sm:flex-row gap-4 pt-4">
						<a href="/products" class="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-white bg-sage-600 hover:bg-sage-700 dark:bg-sage-700 dark:hover:bg-sage-600 transition-all duration-200 shadow-soft hover:shadow-lg hover:-translate-y-0.5 transform">
							{$locale === 'sv' ? 'Produkter' : 'Products'}
							<svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" /></svg>
						</a>
						<a href="/how-to-use" class="inline-flex items-center justify-center px-8 py-4 border-2 border-sage-600 dark:border-sage-500 text-base font-medium rounded-full text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-[#222b28] transition-all duration-200">
							{$locale === 'sv' ? 'Instruktioner' : 'Essential Oil Guide'}
						</a>
					</div>
					<div class="flex flex-wrap gap-6 pt-6 text-sm text-forest-600 dark:text-[#C5D4C5]">
						<div class="flex items-center gap-2">🛡️ <span>{$locale === 'sv' ? '100% Naturligt' : '100% Natural'}</span></div>
						<div class="flex items-center gap-2">🚚 <span>{$locale === 'sv' ? 'Fri frakt över 500kr' : 'Free shipping over 500 SEK'}</span></div>
					</div>
				</div>
				<div class="relative overflow-hidden">
					<div class="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-sage-200 to-forest-300 dark:from-sage-800 dark:to-forest-900 flex items-center justify-center">
						<img src="/images/hero-lifestyle.png" alt="Fortune Essence" class="w-full h-full object-cover" onerror="this.style.display='none'" />
						<span class="text-8xl">🌿</span>
					</div>
					<div class="absolute bottom-2 left-2 sm:-bottom-6 sm:-left-6 bg-white dark:bg-[#1a221f] rounded-2xl p-3 sm:p-4 shadow-xl max-w-[200px]">
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 bg-sage-100 dark:bg-sage-900 rounded-full flex items-center justify-center">✨</div>
							<div>
								<p class="text-xs text-forest-600 dark:text-[#8A9A8A] font-medium">{$locale === 'sv' ? 'Mest populär' : 'Best Seller'}</p>
								<p class="text-sm font-semibold text-forest-800 dark:text-[#E8EDE8]">{$locale === 'sv' ? 'Lavendel Olja' : 'Lavender Oil'}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="py-20 bg-white dark:bg-[#242a28]">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-4xl font-serif font-bold text-forest-700 dark:text-[#F0F5F0] mb-4">{$locale === 'sv' ? 'Varför vi är annorlunda' : 'What makes us different'}</h2>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
				{#each [
					{ icon: '✨', title: $locale === 'sv' ? 'Premium Kvalitet' : 'Premium Quality', desc: $locale === 'sv' ? 'Ren eterisk olja av hög kvalitet.' : 'Pure essential oils of high quality.' },
					{ icon: '🌿', title: $locale === 'sv' ? 'Naturligt & Rent' : 'Natural & Pure', desc: $locale === 'sv' ? 'Inga konstgjorda tillsatser. 100% ekologisk olja.' : 'No artificial additives. 100% organic oil.' },
					{ icon: '🚚', title: $locale === 'sv' ? 'Snabb Leverans' : 'Fast Delivery', desc: $locale === 'sv' ? 'Fri frakt över 500 kr och snabb leverans.' : 'Free shipping over 500 SEK and fast delivery.' },
				] as f}
					<div class="text-center p-8 rounded-2xl hover:shadow-xl transition-all duration-300 bg-cream-50 dark:bg-[#2a3330] hover:bg-white dark:hover:bg-[#343c39] group">
						<div class="text-4xl mb-4">{f.icon}</div>
						<h3 class="text-xl font-semibold text-forest-700 dark:text-[#E8EDE8] mb-3">{f.title}</h3>
						<p class="text-forest-600 dark:text-[#C5D4C5]">{f.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Featured Products -->
	<section class="py-20 bg-cream-50 dark:bg-[#1a1f1e]">
		<div class="container mx-auto px-4">
			<div class="text-center mb-16">
				<h2 class="text-4xl font-serif font-bold text-forest-700 dark:text-[#F0F5F0] mb-4">{$locale === 'sv' ? 'Våra favoriter' : 'Our Favorites'}</h2>
			</div>
			{#if loading}
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
					{#each [1, 2, 3, 4] as _}
						<div class="animate-pulse"><div class="bg-sage-200 dark:bg-[#343c39] aspect-square rounded-2xl mb-4"></div><div class="h-4 bg-sage-200 dark:bg-[#343c39] rounded-full mb-2"></div><div class="h-4 bg-sage-200 dark:bg-[#343c39] rounded-full w-3/4"></div></div>
					{/each}
				</div>
			{:else}
				<ProductGrid products={featuredProducts} locale={$locale} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
			{/if}
			<div class="text-center mt-12">
				<a href="/products" class="inline-flex items-center px-8 py-4 text-base font-medium rounded-full text-white bg-sage-600 hover:bg-sage-700 transition-all duration-200 shadow-soft hover:shadow-lg hover:-translate-y-0.5 transform">
					{$locale === 'sv' ? 'Se alla produkter' : 'Shop All Products'}
					<svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" /></svg>
				</a>
			</div>
		</div>
	</section>
</div>
