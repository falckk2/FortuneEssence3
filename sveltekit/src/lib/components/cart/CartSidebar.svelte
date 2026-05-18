<script lang="ts">
	import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-svelte';
	import { cart } from '$lib/stores/cart';
	import BundleImage from '$lib/components/bundles/BundleImage.svelte';
	import type { Product } from '$lib/types';

	let { isOpen = false, onClose, locale = 'sv' }: {
		isOpen?: boolean;
		onClose: () => void;
		locale?: 'sv' | 'en';
	} = $props();

	interface CartItemWithProduct {
		cartItemId?: string;
		productId: string;
		quantity: number;
		price: number;
		product?: Product;
		bundleSelection?: { bundleProductId: string; selectedProductIds: string[] };
		selectedProducts?: Product[];
	}

	let cartItems: CartItemWithProduct[] = $state([]);
	let loadingProducts = $state(false);

	$effect(() => {
		if (isOpen && $cart.items.length > 0) fetchProductDetails();
		else if (isOpen && $cart.items.length === 0) cartItems = [];
	});

	async function fetchProductDetails() {
		loadingProducts = true;
		try {
			const result: CartItemWithProduct[] = [];
			for (const item of $cart.items) {
				try {
					const res = await fetch(`/api/products/${item.productId}?locale=${locale}`);
					if (!res.ok) { result.push({ ...item }); continue; }
					const data = await res.json();
					const cartItem: CartItemWithProduct = { ...item, product: data.success ? data.data : undefined };
					if (item.bundleSelection?.selectedProductIds) {
						const selectedProducts: Product[] = [];
						for (const pid of item.bundleSelection.selectedProductIds) {
							try {
								const pr = await fetch(`/api/products/${pid}?locale=${locale}`);
								if (pr.ok) { const pd = await pr.json(); if (pd.success) selectedProducts.push(pd.data); }
							} catch {}
						}
						cartItem.selectedProducts = selectedProducts;
					}
					result.push(cartItem);
				} catch { result.push({ ...item }); }
			}
			cartItems = result;
		} catch { cartItems = $cart.items.map(i => ({ ...i })); }
		finally { loadingProducts = false; }
	}

	function getProductImage(product?: Product) {
		if (!product?.images?.length) return '/images/placeholder-product.jpg';
		return product.images[0];
	}

	function getProductName(product?: Product) {
		if (!product) return 'Unknown Product';
		return locale === 'sv' ? product.translations.sv.name : product.translations.en.name;
	}

	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	async function handleQuantityChange(productId: string, quantity: number, cartItemId?: string) {
		await cart.updateQuantity(productId, quantity, cartItemId);
	}

	async function handleRemove(productId: string, cartItemId?: string) {
		await cart.removeItem(productId, cartItemId);
	}

	async function handleClearCart() {
		const msg = locale === 'sv' ? 'Är du säker på att du vill tömma varukorgen?' : 'Are you sure you want to clear the cart?';
		if (confirm(msg)) await cart.clearCart();
	}

	const subtotal = $derived($cart.total);
	const vat = $derived(subtotal * 0.25);
	const totalWithVat = $derived(subtotal * 1.25);
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50">
		<div class="fixed inset-0 bg-forest-900/60 dark:bg-black/70" on:click={onClose} on:keydown={e => e.key === 'Escape' && onClose()} role="button" tabindex="-1" aria-label="Close cart"></div>

		<div class="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
			<div class="pointer-events-auto w-screen max-w-md">
				<div class="flex h-full flex-col overflow-y-scroll bg-white dark:bg-[#242a28] shadow-xl">
					<div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
						<div class="flex items-start justify-between">
							<h2 class="text-lg font-medium text-forest-900 dark:text-[#E8EDE8]">
								{locale === 'sv' ? 'Varukorg' : 'Shopping Cart'}
							</h2>
							<button type="button" on:click={onClose}
								class="relative -m-2 p-2 text-forest-400 dark:text-[#8A9A8A] hover:text-forest-600 dark:hover:text-[#C5D4C5]">
								<X size={24} />
							</button>
						</div>

						<div class="mt-8">
							{#if loadingProducts}
								<div class="space-y-4">
									{#each $cart.items as _, i}
										<div class="animate-pulse flex space-x-4">
											<div class="rounded bg-cream-200 dark:bg-[#2a3330] h-20 w-20"></div>
											<div class="flex-1 space-y-2 py-1">
												<div class="h-4 bg-cream-200 dark:bg-[#2a3330] rounded w-3/4"></div>
												<div class="h-4 bg-cream-200 dark:bg-[#2a3330] rounded w-1/2"></div>
												<div class="h-4 bg-cream-200 dark:bg-[#2a3330] rounded w-1/4"></div>
											</div>
										</div>
									{/each}
								</div>
							{:else if cartItems.length === 0}
								<div class="text-center py-12">
									<ShoppingBag size={48} class="mx-auto text-forest-400 dark:text-[#6B7B6B] mb-4" />
									<h3 class="text-sm font-medium text-forest-900 dark:text-[#E8EDE8] mb-2">
										{locale === 'sv' ? 'Din varukorg är tom' : 'Your cart is empty'}
									</h3>
									<p class="text-sm text-forest-500 dark:text-[#8A9A8A]">
										{locale === 'sv' ? 'Lägg till produkter för att fortsätta' : 'Add products to continue'}
									</p>
								</div>
							{:else}
								<ul class="-my-6 divide-y divide-cream-200 dark:divide-[#3f4946]">
									{#each cartItems as item (item.cartItemId || item.productId)}
										{@const isBundle = !!item.bundleSelection}
										{@const itemKey = item.cartItemId || item.productId}
										<li class="flex py-6">
											<div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-cream-200 dark:border-[#3f4946] flex items-center justify-center">
												{#if isBundle && item.selectedProducts && item.selectedProducts.length > 0}
													<div class="bg-gradient-to-br from-sage-50 to-forest-50 dark:from-[#2a3330] dark:to-[#1e2421] w-full h-full flex items-center justify-center">
														<BundleImage quantity={item.selectedProducts.length} size={44} />
													</div>
												{:else}
													<img src={getProductImage(item.product)} alt={getProductName(item.product)}
														class="h-full w-full object-cover object-center" />
												{/if}
											</div>

											<div class="ml-4 flex flex-1 flex-col">
												<div>
													<div class="flex justify-between text-base font-medium text-forest-900 dark:text-[#E8EDE8]">
														<h3>
															<a href="/products/{item.productId}" on:click={onClose}
																class="hover:text-sage-700 dark:hover:text-sage-400">
																{getProductName(item.product)}
															</a>
														</h3>
														<p class="ml-4">{formatPrice(item.price * item.quantity)}</p>
													</div>
													<p class="mt-1 text-sm text-forest-500 dark:text-[#8A9A8A]">
														{formatPrice(item.price)} {locale === 'sv' ? 'st' : 'each'}
													</p>

													{#if isBundle && item.selectedProducts && item.selectedProducts.length > 0}
														<div class="mt-2 space-y-1">
															<p class="text-xs font-medium text-sage-700 dark:text-sage-400 uppercase tracking-wide">
																{locale === 'sv' ? 'Innehåller:' : 'Contains:'}
															</p>
															<ul class="space-y-1">
																{#each item.selectedProducts as sp, idx}
																	<li class="flex items-center text-xs text-forest-600 dark:text-[#C5D4C5]">
																		<span class="inline-block w-1.5 h-1.5 rounded-full bg-sage-500 mr-2"></span>
																		{locale === 'sv' ? sp.translations.sv.name : sp.translations.en.name}
																	</li>
																{/each}
															</ul>
														</div>
													{/if}
												</div>

												<div class="flex flex-1 items-end justify-between text-sm">
													{#if isBundle}
														<span class="text-forest-500 dark:text-[#8A9A8A]">
															{locale === 'sv' ? 'Antal: 1' : 'Qty: 1'}
														</span>
													{:else}
														<div class="flex items-center space-x-2">
															<button on:click={() => handleQuantityChange(item.productId, item.quantity - 1, item.cartItemId)}
																disabled={$cart.isLoading || item.quantity <= 1}
																class="flex items-center justify-center w-8 h-8 rounded-full border border-cream-300 dark:border-[#3f4946] hover:bg-cream-50 dark:hover:bg-[#2a3330] disabled:opacity-50 disabled:cursor-not-allowed text-forest-700 dark:text-[#C5D4C5]">
																<Minus size={16} />
															</button>
															<span class="font-medium text-forest-900 dark:text-[#E8EDE8]">{item.quantity}</span>
															<button on:click={() => handleQuantityChange(item.productId, item.quantity + 1, item.cartItemId)}
																disabled={$cart.isLoading}
																class="flex items-center justify-center w-8 h-8 rounded-full border border-cream-300 dark:border-[#3f4946] hover:bg-cream-50 dark:hover:bg-[#2a3330] disabled:opacity-50 disabled:cursor-not-allowed text-forest-700 dark:text-[#C5D4C5]">
																<Plus size={16} />
															</button>
														</div>
													{/if}

													<button type="button" on:click={() => handleRemove(item.productId, item.cartItemId)}
														disabled={$cart.isLoading}
														class="font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
														<Trash2 size={16} class="mr-1" />
														{locale === 'sv' ? 'Ta bort' : 'Remove'}
													</button>
												</div>
											</div>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>

					{#if cartItems.length > 0}
						<div class="border-t border-cream-200 dark:border-[#3f4946] px-4 py-6 sm:px-6">
							<div class="space-y-4">
								<button on:click={handleClearCart} disabled={$cart.isLoading}
									class="text-sm text-forest-500 dark:text-[#8A9A8A] hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed">
									{locale === 'sv' ? 'Töm varukorg' : 'Clear cart'}
								</button>

								<div class="flex justify-between text-base font-medium text-forest-900 dark:text-[#E8EDE8]">
									<p>Subtotal</p>
									<p>{formatPrice(subtotal)}</p>
								</div>
								<div class="flex justify-between text-sm text-forest-600 dark:text-[#C5D4C5]">
									<p>{locale === 'sv' ? 'Moms (25%)' : 'VAT (25%)'}</p>
									<p>{formatPrice(vat)}</p>
								</div>
								<div class="flex justify-between text-lg font-bold text-forest-900 dark:text-[#E8EDE8] border-t border-cream-200 dark:border-[#3f4946] pt-4">
									<p>{locale === 'sv' ? 'Totalt' : 'Total'}</p>
									<p>{formatPrice(totalWithVat)}</p>
								</div>

								<p class="text-sm text-forest-500 dark:text-[#8A9A8A]">
									{locale === 'sv' ? 'Frakt och leverans beräknas vid kassan.' : 'Shipping and delivery calculated at checkout.'}
								</p>

								<div class="mt-6">
									<a href="/checkout" on:click={onClose}
										class="flex w-full items-center justify-center rounded-md border border-transparent bg-sage-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-sage-700 transition-colors">
										{locale === 'sv' ? 'Gå till kassan' : 'Checkout'}
									</a>
								</div>

								<div class="mt-6 flex justify-center text-center text-sm text-forest-500 dark:text-[#8A9A8A]">
									<p>
										{locale === 'sv' ? 'eller ' : 'or '}
										<button type="button" on:click={onClose}
											class="font-medium text-sage-700 dark:text-sage-400 hover:text-sage-800 dark:hover:text-sage-300">
											{locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'} &rarr;
										</button>
									</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
