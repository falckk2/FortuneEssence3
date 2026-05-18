<script lang="ts">
	import type { Product } from '$lib/types';
	import { cart } from '$lib/stores/cart';
	import { wishlist } from '$lib/stores/wishlist';
	import { toast } from '$lib/stores/toast';
	import { ShoppingCart, Heart } from 'lucide-svelte';

	export let product: Product;
	export let locale: 'sv' | 'en' = 'sv';
	export let onAddToCart: ((id: string) => void) | undefined = undefined;
	export let onToggleWishlist: ((id: string) => void) | undefined = undefined;

	$: name = product.translations[locale]?.name ?? product.name;
	$: inWishlist = $wishlist.items.some(i => i.productId === product.id);
	$: isOutOfStock = product.stock === 0;

	async function handleAddToCart() {
		if (onAddToCart) { onAddToCart(product.id); return; }
		try {
			await cart.addItem({ productId: product.id, quantity: 1, price: product.price });
			toast.success(locale === 'sv' ? 'Tillagd i varukorgen' : 'Added to cart');
		} catch {
			toast.error(locale === 'sv' ? 'Kunde inte lägga till' : 'Failed to add');
		}
	}

	async function handleToggleWishlist() {
		if (onToggleWishlist) { onToggleWishlist(product.id); return; }
		if (inWishlist) await wishlist.removeItem(product.id);
		else await wishlist.addItem(product.id);
	}
</script>

<div class="group relative flex flex-col bg-white dark:bg-[#2a3330] rounded-2xl overflow-hidden shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
	<a href="/products/{product.id}" class="block">
		<div class="relative aspect-square bg-cream-100 dark:bg-[#343c39] overflow-hidden">
			{#if product.images?.[0]}
				<img src={product.images[0]} alt={name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
			{:else}
				<div class="w-full h-full flex items-center justify-center text-forest-400 dark:text-[#6B7B6B]">
					<span class="text-4xl">🌿</span>
				</div>
			{/if}
			{#if isOutOfStock}
				<div class="absolute inset-0 bg-black/40 flex items-center justify-center">
					<span class="bg-white text-forest-800 px-3 py-1 rounded-full text-sm font-medium">
						{locale === 'sv' ? 'Slut i lager' : 'Out of stock'}
					</span>
				</div>
			{/if}
		</div>
	</a>

	<div class="p-4 flex flex-col gap-2 flex-1">
		<a href="/products/{product.id}">
			<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] leading-snug hover:text-sage-700 dark:hover:text-sage-300 transition-colors">
				{name}
			</h3>
		</a>
		<p class="text-lg font-bold text-forest-800 dark:text-[#E8EDE8] mt-auto">
			{new Intl.NumberFormat(locale === 'sv' ? 'sv-SE' : 'en-US', { style: 'currency', currency: 'SEK' }).format(product.price)}
		</p>
		<div class="flex gap-2 mt-1">
			<button
				on:click={handleAddToCart}
				disabled={isOutOfStock}
				class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<ShoppingCart size={16} />
				{locale === 'sv' ? 'Lägg till' : 'Add to cart'}
			</button>
			<button
				on:click={handleToggleWishlist}
				class="w-10 h-10 flex items-center justify-center rounded-full border-2 {inWishlist ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'border-cream-300 dark:border-[#4a5552] text-forest-400 hover:border-rose-400 hover:text-rose-400'} transition-colors"
			>
				<Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
			</button>
		</div>
	</div>
</div>
