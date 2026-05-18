<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { cart } from '$lib/stores/cart';
	import { toast } from '$lib/stores/toast';
	import { page } from '$app/stores';

	export let locale: 'sv' | 'en' = 'sv';
	export let onSuccess: () => void = () => {};

	let step = 1;
	let cartData: any = null;
	let loading = true;
	let processing = false;

	let address = { firstName: '', lastName: '', email: '', phone: '', street: '', city: '', postalCode: '', country: 'SE' };
	let selectedShipping: any = null;
	let shippingOptions: any[] = [];
	let loadingShipping = false;
	let paymentIntentId = '';
	let sessionId = '';

	onMount(async () => {
		sessionId = localStorage.getItem('sessionId') || '';
		const headers: HeadersInit = { 'Content-Type': 'application/json' };
		if (sessionId) headers['x-session-id'] = sessionId;

		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers,
				body: JSON.stringify({ action: 'validate-cart' }),
			});
			const data = await res.json();
			if (data.success) cartData = data.data;
			else toast.error(locale === 'sv' ? 'Kunde inte validera varukorgen' : 'Failed to validate cart');
		} finally {
			loading = false;
		}
	});

	async function calculateShipping() {
		if (!address.postalCode || !address.country) return;
		loadingShipping = true;
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'calculate-shipping', cartId: cartData?.cart?.id, address }),
			});
			const data = await res.json();
			if (data.success) shippingOptions = data.data?.options ?? [];
		} finally {
			loadingShipping = false;
		}
	}

	async function processPayment() {
		if (!selectedShipping || !cartData) return;
		processing = true;
		try {
			const total = (cartData.cart?.total ?? 0) + (selectedShipping.price ?? 0);
			const piRes = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'create-payment-intent', amount: Math.round(total * 100), currency: 'sek' }),
			});
			const piData = await piRes.json();
			if (!piData.success) { toast.error('Payment setup failed'); return; }

			const payRes = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'process-payment',
					paymentIntentId: piData.data?.id,
					cartId: cartData.cart?.id,
					shippingOption: selectedShipping,
					address,
					customerId: $page.data.session?.user?.id,
					sessionId,
				}),
			});
			const payData = await payRes.json();
			if (payData.success) {
				await cart.refresh();
				goto(`/checkout/success?orderId=${payData.data?.orderId ?? ''}`);
				onSuccess();
			} else {
				toast.error(payData.error ?? (locale === 'sv' ? 'Betalning misslyckades' : 'Payment failed'));
			}
		} finally {
			processing = false;
		}
	}
</script>

{#if loading}
	<div class="flex justify-center py-16"><div class="w-10 h-10 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
{:else if !cartData}
	<div class="text-center py-16">
		<p class="text-forest-600 dark:text-[#B8C5B8] mb-4">{locale === 'sv' ? 'Din varukorg är tom' : 'Your cart is empty'}</p>
		<a href="/products" class="px-6 py-3 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors">
			{locale === 'sv' ? 'Handla nu' : 'Shop now'}
		</a>
	</div>
{:else}
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Left: Form -->
		<div class="lg:col-span-2 space-y-6">
			{#if step === 1}
				<!-- Delivery Address -->
				<div class="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft">
					<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">{locale === 'sv' ? 'Leveransadress' : 'Delivery Address'}</h2>
					<div class="grid grid-cols-2 gap-4">
						{#each [['firstName', locale === 'sv' ? 'Förnamn' : 'First name'], ['lastName', locale === 'sv' ? 'Efternamn' : 'Last name']] as [field, label]}
							<div>
								<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">{label}</label>
								<input bind:value={address[field]} class="w-full px-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" />
							</div>
						{/each}
					</div>
					<div class="grid grid-cols-1 gap-4 mt-4">
						{#each [['email', locale === 'sv' ? 'E-post' : 'Email', 'email'], ['phone', locale === 'sv' ? 'Telefon' : 'Phone', 'tel'], ['street', locale === 'sv' ? 'Gatuadress' : 'Street', 'text'], ['city', locale === 'sv' ? 'Stad' : 'City', 'text'], ['postalCode', locale === 'sv' ? 'Postnummer' : 'Postal code', 'text']] as [field, label, type]}
							<div>
								<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">{label}</label>
								<input type={type} bind:value={address[field]} class="w-full px-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" />
							</div>
						{/each}
					</div>
					<button on:click={() => { step = 2; calculateShipping(); }} class="mt-6 w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium transition-colors">
						{locale === 'sv' ? 'Välj frakt' : 'Choose shipping'}
					</button>
				</div>
			{:else if step === 2}
				<!-- Shipping -->
				<div class="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft">
					<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">{locale === 'sv' ? 'Fraktalternativ' : 'Shipping options'}</h2>
					{#if loadingShipping}
						<div class="flex justify-center py-8"><div class="w-8 h-8 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
					{:else if shippingOptions.length === 0}
						<p class="text-forest-600 dark:text-[#B8C5B8]">{locale === 'sv' ? 'Inga fraktalternativ tillgängliga' : 'No shipping options available'}</p>
					{:else}
						<div class="space-y-3">
							{#each shippingOptions as option}
								<label class="flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all {selectedShipping?.id === option.id ? 'border-sage-600 bg-sage-50 dark:bg-sage-900/20' : 'border-cream-200 dark:border-[#4a5552]'}">
									<input type="radio" bind:group={selectedShipping} value={option} class="hidden" />
									<div class="flex-1">
										<p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{option.name}</p>
										<p class="text-sm text-forest-600 dark:text-[#B8C5B8]">{option.estimatedDays}</p>
									</div>
									<span class="font-semibold text-forest-800 dark:text-[#E8EDE8]">
										{option.price === 0 ? (locale === 'sv' ? 'Gratis' : 'Free') : `${option.price} kr`}
									</span>
								</label>
							{/each}
						</div>
					{/if}
					<div class="flex gap-3 mt-6">
						<button on:click={() => step = 1} class="flex-1 py-3 border border-cream-300 dark:border-[#4a5552] rounded-full text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-100 dark:hover:bg-[#343c39] transition-colors">
							{locale === 'sv' ? 'Tillbaka' : 'Back'}
						</button>
						<button on:click={processPayment} disabled={!selectedShipping || processing} class="flex-1 py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium transition-colors disabled:opacity-50">
							{processing ? '...' : (locale === 'sv' ? 'Betala' : 'Pay now')}
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right: Order Summary -->
		<div class="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft h-fit">
			<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">{locale === 'sv' ? 'Din order' : 'Your order'}</h3>
			<div class="space-y-3 mb-4">
				{#each cartData.cart?.items ?? [] as item}
					<div class="flex justify-between text-sm">
						<span class="text-forest-700 dark:text-[#C5D4C5]">{item.product?.name ?? 'Produkt'} × {item.quantity}</span>
						<span class="font-medium text-forest-800 dark:text-[#E8EDE8]">{(item.price * item.quantity).toFixed(2)} kr</span>
					</div>
				{/each}
			</div>
			<div class="border-t border-cream-200 dark:border-[#4a5552] pt-4 flex justify-between font-bold text-forest-800 dark:text-[#E8EDE8]">
				<span>{locale === 'sv' ? 'Totalt' : 'Total'}</span>
				<span>{cartData.cart?.total?.toFixed(2)} kr</span>
			</div>
		</div>
	</div>
{/if}
