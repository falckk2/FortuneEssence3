<script lang="ts">
	import { ShoppingCart } from 'lucide-svelte';
	import { cartItemCount } from '$lib/stores/cart';
	import CartSidebar from './CartSidebar.svelte';

	let isOpen = false;
</script>

<button on:click={() => (isOpen = true)}
	class="relative p-2 text-forest-600 hover:text-forest-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors"
	aria-label="Cart">
	<ShoppingCart class="h-6 w-6" />
	{#if $cartItemCount > 0}
		<span class="absolute -top-1 -right-1 bg-sage-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
			{$cartItemCount > 99 ? '99+' : $cartItemCount}
		</span>
	{/if}
</button>

<CartSidebar {isOpen} onClose={() => (isOpen = false)} />
