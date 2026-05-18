<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { locale } from '$lib/stores/locale';
	import { CheckCircle, ArrowRight, Truck } from 'lucide-svelte';

	let orderNumber = '';
	let shippingLabel: any = null;
	let isLoadingLabel = false;

	$: orderId = $page.url.searchParams.get('orderId') ?? '';

	onMount(async () => {
		if (orderId) {
			orderNumber = orderId.slice(0, 13).toUpperCase();
			isLoadingLabel = true;
			try {
				const res = await fetch(`/api/shipping/labels?orderId=${orderId}`);
				const data = await res.json();
				if (data.success && data.data) shippingLabel = data.data;
			} finally { isLoadingLabel = false; }
		} else {
			orderNumber = `FE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
		}
	});

	const carrierNames: Record<string, string> = { POSTNORD: 'PostNord', DHL: 'DHL', BRING: 'Bring', DB_SCHENKER: 'DB Schenker' };
</script>

<svelte:head><title>{$locale === 'sv' ? 'Beställning bekräftad' : 'Order confirmed'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
	<div class="container mx-auto px-4">
		<div class="max-w-2xl mx-auto text-center">
			<div class="mb-8">
				<div class="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
					<CheckCircle size={48} class="text-green-600" />
				</div>
				<h1 class="text-4xl font-serif font-bold text-forest-800 mb-4">{$locale === 'sv' ? 'Tack för din beställning!' : 'Thank you for your order!'}</h1>
				{#if orderNumber}
					<p class="text-forest-600 mb-2">{$locale === 'sv' ? 'Ordernummer' : 'Order number'}:</p>
					<div class="inline-block bg-cream-100 px-6 py-3 rounded-xl font-mono font-bold text-forest-800 text-xl mb-6">{orderNumber}</div>
				{/if}
				<p class="text-forest-600 max-w-lg mx-auto">
					{$locale === 'sv' ? 'En orderbekräftelse har skickats till din e-postadress. Vi behandlar din beställning omgående.' : 'An order confirmation has been sent to your email. We are processing your order promptly.'}
				</p>
			</div>

			{#if shippingLabel}
				<div class="bg-sage-50 border border-sage-200 rounded-2xl p-6 mb-8 text-left">
					<div class="flex items-start gap-3">
						<Truck size={24} class="text-sage-600 flex-shrink-0 mt-1" />
						<div>
							<h3 class="font-semibold text-forest-800 mb-1">{$locale === 'sv' ? 'Spårningsinformation' : 'Tracking information'}</h3>
							<p class="text-sm text-forest-600">{carrierNames[shippingLabel.carrierCode] ?? shippingLabel.carrierCode}: <strong>{shippingLabel.trackingNumber}</strong></p>
							<button on:click={() => window.open(`/api/shipping/labels/download?orderId=${orderId}`, '_blank')} class="mt-3 px-4 py-2 bg-sage-600 text-white rounded-full text-sm hover:bg-sage-700 transition-colors">
								{$locale === 'sv' ? 'Ladda ner fraktetikett' : 'Download shipping label'}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<a href="/account/orders" class="inline-flex items-center justify-center px-6 py-3 border-2 border-sage-600 text-sage-700 rounded-full hover:bg-sage-50 transition-colors">
					{$locale === 'sv' ? 'Mina beställningar' : 'My orders'}
				</a>
				<a href="/products" class="inline-flex items-center justify-center px-6 py-3 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors">
					{$locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
					<ArrowRight size={16} class="ml-2" />
				</a>
			</div>
		</div>
	</div>
</div>
