<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';
	import { wishlist } from '$lib/stores/wishlist';
	import { cart } from '$lib/stores/cart';
	import { toast } from '$lib/stores/toast';
	import type { Product } from '$lib/types';
	import ProductCard from '$lib/components/products/ProductCard.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Heart, ShoppingBag, ArrowRight } from 'lucide-svelte';

	let { data } = $props();
	const session = $derived(data.session);

	let products: Product[] = [];
	let loading = true;

	onMount(async () => {
		if (!session?.user) {
			toast.error($locale === 'sv' ? 'Du måste vara inloggad för att se din önskelista' : 'You must be logged in');
			goto('/auth/signin');
			return;
		}
		await wishlist.refresh();
		await fetchProducts();
	});

	async function fetchProducts() {
		if ($wishlist.items.length === 0) { loading = false; return; }
		loading = true;
		try {
			const res = await fetch('/api/products?locale=' + $locale);
			const data = await res.json();
			if (data.success) {
				const ids = $wishlist.items.map(i => i.productId);
				products = data.data.filter((p: Product) => ids.includes(p.id));
			}
		} finally { loading = false; }
	}

	async function handleRemove(productId: string) {
		await wishlist.removeItem(productId);
		products = products.filter(p => p.id !== productId);
		toast.success($locale === 'sv' ? 'Borttagen från önskelista' : 'Removed from wishlist');
	}

	async function handleAddToCart(productId: string) {
		const product = products.find(p => p.id === productId);
		if (!product) return;
		await cart.addItem({ productId, quantity: 1, price: product.price });
		toast.success($locale === 'sv' ? 'Tillagd i varukorgen' : 'Added to cart');
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Önskelista' : 'Wishlist'} – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-12">
	<div class="container mx-auto px-4">
		<div class="flex items-center gap-3 mb-8">
			<Heart size={32} class="text-rose-500" />
			<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8]">{$locale === 'sv' ? 'Min Önskelista' : 'My Wishlist'}</h1>
		</div>

		{#if loading}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each [1, 2, 3, 4] as _}
					<div class="h-80 bg-cream-200 dark:bg-[#343c39] rounded-2xl animate-pulse"></div>
				{/each}
			</div>
		{:else if products.length === 0}
			<div class="text-center py-24">
				<Heart size={64} class="text-cream-400 dark:text-[#4a5552] mx-auto mb-6" />
				<h2 class="text-2xl font-semibold text-forest-700 dark:text-[#C5D4C5] mb-4">{$locale === 'sv' ? 'Din önskelista är tom' : 'Your wishlist is empty'}</h2>
				<a href="/products" class="inline-flex items-center px-8 py-3 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors">
					{$locale === 'sv' ? 'Utforska produkter' : 'Explore products'}<ArrowRight size={16} class="ml-2" />
				</a>
			</div>
		{:else}
			<p class="text-forest-600 dark:text-[#B8C5B8] mb-6">{products.length} {$locale === 'sv' ? 'produkter' : 'products'}</p>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each products as product (product.id)}
					<ProductCard {product} locale={$locale} onAddToCart={handleAddToCart} onToggleWishlist={handleRemove} />
				{/each}
			</div>
		{/if}
	</div>
</div>
