<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';
	import { cart } from '$lib/stores/cart';
	import { wishlist } from '$lib/stores/wishlist';
	import { toast } from '$lib/stores/toast';
	import type { Product, BundleConfiguration } from '$lib/types';
	import { PriceCalculator } from '$lib/utils/helpers';
	import { getProductBenefits } from '$lib/utils/productBenefits';
	import ProductGrid from '$lib/components/products/ProductGrid.svelte';
	import ProductReviews from '$lib/components/products/ProductReviews.svelte';
	import BundleSelector from '$lib/components/bundles/BundleSelector.svelte';
	import BundleImage from '$lib/components/bundles/BundleImage.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ShoppingCart, Heart, ArrowLeft, CheckCircle, Truck, ShieldCheck } from 'lucide-svelte';

	let { data } = $props();

	const productId = $derived($page.params.id);
	let product = $state<Product | null>(null);
	let bundleConfig = $state<BundleConfiguration | null>(null);
	let relatedProducts = $state<Product[]>([]);
	let loading = $state(true);
	let quantity = $state(1);
	let selectedImage = $state(0);
	let imageError = $state(false);
	let cartLoading = $state(false);

	const session = $derived(data.session);
	const isInWishlist = $derived($wishlist.items.some(i => i.productId === productId));
	const isOutOfStock = $derived(product ? product.stock === 0 : false);
	const isLowStock = $derived(product ? product.stock > 0 && product.stock <= 5 : false);
	const localizedName = $derived(product ? (product.translations[$locale]?.name ?? product.name) : '');
	const localizedDescription = $derived(product ? (product.translations[$locale]?.description ?? '') : '');
	const images = $derived(product?.images?.length ? product.images : ['/images/placeholder-product.jpg']);
	const productBenefits = $derived(product ? getProductBenefits(product.name, product.category) : []);

	onMount(async () => {
		await fetchProduct();
	});

	async function fetchProduct() {
		loading = true;
		try {
			const res = await fetch(`/api/products/${productId}`);
			const data = await res.json();
			if (data.success && data.data) {
				product = data.data;
				if (product?.category === 'bundles') {
					const br = await fetch(`/api/bundles/${productId}`);
					const bd = await br.json();
					if (bd.success) bundleConfig = bd.data;
				}
				const rr = await fetch(`/api/products?category=${product?.category}&limit=4`);
				const rd = await rr.json();
				if (rd.success) relatedProducts = rd.data.filter((p: Product) => p.id !== productId).slice(0, 4);
			} else {
				toast.error($locale === 'sv' ? 'Produkten hittades inte' : 'Product not found');
				goto('/products');
			}
		} finally { loading = false; }
	}

	async function handleAddToCart() {
		if (isOutOfStock || !product) return;
		cartLoading = true;
		try {
			await cart.addItem({ productId: product.id, quantity, price: product.price });
			toast.success($locale === 'sv' ? `${localizedName} tillagd i varukorgen` : `${localizedName} added to cart`);
		} catch { toast.error($locale === 'sv' ? 'Kunde inte lägga till' : 'Failed to add'); }
		finally { cartLoading = false; }
	}

	async function handleToggleWishlist() {
		if (!session?.user) { toast.error($locale === 'sv' ? 'Du måste vara inloggad' : 'Sign in required'); goto('/auth/signin'); return; }
		if (isInWishlist) await wishlist.removeItem(productId);
		else await wishlist.addItem(productId);
	}

	const categoryColors: Record<string, string> = {
		'essential-oils': 'bg-sage-100 text-sage-700 border-sage-200',
		'carrier-oils': 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
		'bundles': 'bg-gradient-to-r from-sage-100 to-forest-100 text-forest-800 border-sage-300',
	};
	const categoryNames: Record<string, Record<string, string>> = {
		'essential-oils': { sv: 'Eteriska oljor', en: 'Essential Oils' },
		'carrier-oils': { sv: 'Bäraroljor', en: 'Carrier Oils' },
		'bundles': { sv: 'Paket', en: 'Bundles' },
	};
</script>

<svelte:head><title>{localizedName || 'Produkt'} – Fortune Essence</title></svelte:head>
<Toast />

{#if loading}
	<div class="min-h-screen bg-cream-50 flex items-center justify-center">
		<div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else if product}
	<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e]">
		<div class="bg-white dark:bg-[#242a28] border-b border-cream-200 dark:border-[#3f4946]">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<a href="/products" class="inline-flex items-center text-forest-600 hover:text-sage-700 transition-colors">
					<ArrowLeft size={20} class="mr-2" />
					<span class="font-medium">{$locale === 'sv' ? 'Tillbaka till produkter' : 'Back to products'}</span>
				</a>
			</div>
		</div>

		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
				<!-- Images -->
				<div class="space-y-4">
					<div class="relative aspect-square w-full overflow-hidden rounded-3xl bg-gradient-to-br from-sage-50 to-forest-50 shadow-soft flex items-center justify-center">
						{#if product.category === 'bundles' && bundleConfig}
							<div class="p-8"><BundleImage quantity={bundleConfig.requiredQuantity} /></div>
						{:else}
							<img src={images[selectedImage]} alt={localizedName} class="w-full h-full object-cover" onerror={() => imageError = true} />
						{/if}
						{#if productBenefits.length > 0}
							<div class="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
								{#each productBenefits as benefit}
									<span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm border {benefit.color} shadow-md">
										<span>{benefit.icon}</span><span>{benefit.label[$locale]}</span>
									</span>
								{/each}
							</div>
						{/if}
					</div>
					{#if product.category !== 'bundles' && images.length > 1}
						<div class="grid grid-cols-4 gap-3">
							{#each images as img, i}
								<button on:click={() => selectedImage = i} class="relative aspect-square overflow-hidden rounded-2xl transition-all {selectedImage === i ? 'ring-4 ring-sage-600' : 'ring-2 ring-cream-200 opacity-70 hover:opacity-100'}">
									<img src={img} alt="{localizedName} {i + 1}" class="w-full h-full object-cover" />
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Info -->
				<div class="space-y-6">
					<span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border {categoryColors[product.category] ?? 'bg-cream-200 text-forest-700 border-cream-300'}">
						{categoryNames[product.category]?.[$locale] ?? product.category}
					</span>
					<div>
						<h1 class="text-4xl lg:text-5xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] leading-tight mb-2">{localizedName}</h1>
						<p class="text-forest-600 dark:text-[#8A9A8A] text-sm">SKU: {product.sku}</p>
					</div>
					<div class="flex items-baseline gap-3">
						<span class="text-4xl font-bold text-forest-800 dark:text-[#E8EDE8]">{PriceCalculator.formatPrice(product.price, $locale)}</span>
						<span class="text-forest-500 dark:text-[#6B7B6B]">{$locale === 'sv' ? 'Inkl. 25% moms' : 'Incl. 25% VAT'}</span>
					</div>
					<div>
						{#if isOutOfStock}
							<div class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-100 text-red-800 border border-red-200">
								<span class="w-2 h-2 rounded-full bg-red-500"></span>
								{$locale === 'sv' ? 'Slut i lager' : 'Out of stock'}
							</div>
						{:else if isLowStock}
							<div class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-terracotta-100 text-terracotta-800 border border-terracotta-200">
								<span class="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse"></span>
								{$locale === 'sv' ? `Bara ${product.stock} kvar!` : `Only ${product.stock} left!`}
							</div>
						{:else}
							<div class="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200">
								<CheckCircle size={20} />{$locale === 'sv' ? 'I lager' : 'In stock'}
							</div>
						{/if}
					</div>
					<p class="text-forest-700 dark:text-[#B8C5B8] leading-relaxed text-lg">{localizedDescription}</p>

					{#if product.category === 'bundles' && bundleConfig}
						<div class="pt-4"><BundleSelector bundleProduct={product} {bundleConfig} locale={$locale} /></div>
					{:else}
						<div class="space-y-4 pt-4">
							{#if !isOutOfStock}
								<div>
									<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-2">{$locale === 'sv' ? 'Antal' : 'Quantity'}</label>
									<div class="flex items-center gap-3">
										<button on:click={() => quantity = Math.max(1, quantity - 1)} disabled={quantity <= 1} class="w-12 h-12 rounded-full bg-white dark:bg-[#343c39] border-2 border-cream-300 dark:border-[#4a5552] text-forest-700 dark:text-[#E8EDE8] font-bold hover:border-sage-600 disabled:opacity-50 transition-all">-</button>
										<span class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8] w-16 text-center">{quantity}</span>
										<button on:click={() => quantity = Math.min(product.stock, quantity + 1)} disabled={quantity >= product.stock} class="w-12 h-12 rounded-full bg-white dark:bg-[#343c39] border-2 border-cream-300 dark:border-[#4a5552] text-forest-700 dark:text-[#E8EDE8] font-bold hover:border-sage-600 disabled:opacity-50 transition-all">+</button>
									</div>
								</div>
							{/if}
							<div class="flex gap-3">
								<button on:click={handleAddToCart} disabled={isOutOfStock || cartLoading} class="flex-1 flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg {isOutOfStock ? 'bg-cream-200 text-forest-400 cursor-not-allowed' : 'bg-sage-600 text-white hover:bg-sage-700 hover:shadow-xl hover:-translate-y-0.5 transform'} {cartLoading ? 'opacity-75' : ''}">
									{#if cartLoading}<div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
									{:else if !isOutOfStock}<ShoppingCart size={24} class="mr-3" />{/if}
									{isOutOfStock ? ($locale === 'sv' ? 'Slutsåld' : 'Sold Out') : ($locale === 'sv' ? 'Lägg i varukorg' : 'Add to Cart')}
								</button>
								<button on:click={handleToggleWishlist} class="w-16 h-16 flex items-center justify-center rounded-full bg-white dark:bg-[#343c39] border-2 {isInWishlist ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-cream-300 dark:border-[#4a5552] hover:border-rose-500'} transition-all shadow-lg">
									<Heart size={28} fill={isInWishlist ? 'currentColor' : 'none'} class={isInWishlist ? 'text-rose-500' : 'text-forest-400'} />
								</button>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-4 pt-6 border-t border-cream-200 dark:border-[#3f4946]">
						<div class="flex items-start gap-3"><Truck size={24} class="text-sage-600 flex-shrink-0 mt-1" /><div><p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{$locale === 'sv' ? 'Snabb leverans' : 'Fast delivery'}</p><p class="text-sm text-forest-600 dark:text-[#8A9A8A]">2–4 {$locale === 'sv' ? 'arbetsdagar' : 'business days'}</p></div></div>
						<div class="flex items-start gap-3"><ShieldCheck size={24} class="text-sage-600 flex-shrink-0 mt-1" /><div><p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{$locale === 'sv' ? 'Säker betalning' : 'Secure payment'}</p><p class="text-sm text-forest-600 dark:text-[#8A9A8A]">{$locale === 'sv' ? 'Krypterad' : 'Encrypted'}</p></div></div>
					</div>
				</div>
			</div>

			<div class="mt-16 lg:mt-24">
				<ProductReviews {productId} userId={session?.user?.id} />
			</div>

			{#if relatedProducts.length > 0}
				<div class="mt-16 lg:mt-24">
					<div class="text-center mb-8">
						<h2 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-3">{$locale === 'sv' ? 'Liknande produkter' : 'Related Products'}</h2>
					</div>
					<ProductGrid products={relatedProducts} locale={$locale} />
				</div>
			{/if}
		</div>
	</div>
{/if}
