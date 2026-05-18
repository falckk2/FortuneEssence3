<script lang="ts">
	import { locale } from '$lib/stores/locale';
	import { ArrowLeft, Truck, Archive, Clock } from 'lucide-svelte';

	let orderNumber = '';
	let orderData: any = null;
	let loading = false;
	let error = '';

	function getTrackingUrl(carrier: string, trackingNumber: string) {
		const lc = (carrier || '').toLowerCase();
		if (lc.includes('postnord')) return `https://www.postnord.se/sv/verktyg/spara/sok-spara?shipmentId=${trackingNumber}`;
		if (lc.includes('dhl')) return `https://www.dhl.com/se-sv/home/tracking.html?tracking-id=${trackingNumber}`;
		if (lc.includes('bring')) return `https://tracking.bring.com/tracking/${trackingNumber}`;
		if (lc.includes('ups')) return `https://www.ups.com/track?tracknum=${trackingNumber}`;
		if (lc.includes('fedex')) return `https://www.fedex.com/fedextrack/?tracknumbers=${trackingNumber}`;
		return `https://www.postnord.se/sv/verktyg/spara/sok-spara?shipmentId=${trackingNumber}`;
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleDateString($locale === 'sv' ? 'sv-SE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function getStatusColor(status: string) {
		const s = status.toLowerCase();
		if (s === 'delivered') return 'text-green-600 bg-green-100';
		if (s === 'shipped' || s === 'under transport') return 'text-blue-600 bg-blue-100';
		if (s === 'pending') return 'text-yellow-600 bg-yellow-100';
		return 'text-forest-600 bg-cream-100';
	}

	async function handleTrack(e: Event) {
		e.preventDefault();
		if (!orderNumber.trim()) return;
		loading = true;
		error = '';
		orderData = null;
		try {
			const res = await fetch(`/api/orders?action=track-by-order&orderNumber=${encodeURIComponent(orderNumber.trim())}`);
			const data = await res.json();
			if (!res.ok || !data.success) {
				error = $locale === 'sv' ? 'Beställningen hittades inte. Kontrollera ordernumret och försök igen.' : 'Order not found. Please check the order number and try again.';
			} else {
				orderData = data.data;
			}
		} catch {
			error = $locale === 'sv' ? 'Något gick fel. Försök igen.' : 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Spåra din beställning' : 'Track your order'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
	<div class="container mx-auto px-4">
		<div class="mb-8">
			<a href="/" class="inline-flex items-center text-sage-600 hover:text-sage-700 mb-4">
				<ArrowLeft size={16} class="mr-2" />{$locale === 'sv' ? 'Tillbaka till start' : 'Back to home'}
			</a>
			<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8]">
				{$locale === 'sv' ? 'Spåra din beställning' : 'Track your order'}
			</h1>
			<p class="text-forest-600 dark:text-[#B8C5B8] mt-2">
				{$locale === 'sv' ? 'Ange ditt ordernummer för att se spårningsinformation' : 'Enter your order number to see tracking information'}
			</p>
		</div>

		<div class="max-w-2xl mx-auto">
			<div class="bg-white dark:bg-[#2a3330] rounded-xl shadow-soft p-8 mb-8">
				<form on:submit={handleTrack} class="space-y-6">
					<div>
						<label for="orderNumber" class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-2">
							{$locale === 'sv' ? 'Ordernummer' : 'Order number'}
						</label>
						<input id="orderNumber" type="text" bind:value={orderNumber}
							placeholder={$locale === 'sv' ? 'Ange ordernummer' : 'Enter order number'}
							class="w-full px-4 py-3 border border-cream-300 dark:border-[#4a5552] rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 bg-white dark:bg-[#343c39] dark:text-[#E8EDE8] text-lg" required />
						<p class="text-sm text-forest-500 dark:text-[#8A9A8A] mt-2">
							{$locale === 'sv' ? 'Du hittar ordernumret i orderbekräftelsen som skickades till din e-post' : 'You can find the order number in the order confirmation sent to your email'}
						</p>
					</div>
					{#if error}
						<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">{error}</div>
					{/if}
					<button type="submit" disabled={loading || !orderNumber.trim()} class="w-full bg-sage-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-sage-700 disabled:opacity-50 transition-colors">
						{loading ? ($locale === 'sv' ? 'Söker...' : 'Searching...') : ($locale === 'sv' ? 'Hitta beställning' : 'Find order')}
					</button>
				</form>
			</div>

			{#if orderData}
				<div class="bg-white dark:bg-[#2a3330] rounded-xl shadow-soft p-8">
					<h2 class="text-2xl font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
						{$locale === 'sv' ? 'Beställningsinformation' : 'Order information'}
					</h2>

					<div class="bg-gradient-to-r from-sage-50 to-yellow-50 dark:from-[#2a3330] dark:to-[#343c39] rounded-lg p-6 mb-6">
						<div>
							<h3 class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8] mb-2">
								{$locale === 'sv' ? 'Aktuell status' : 'Current status'}
							</h3>
							<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {getStatusColor(orderData.status)}">
								{#if orderData.status === 'delivered'}<Archive size={16} class="mr-1" />
								{:else if orderData.status === 'shipped'}<Truck size={16} class="mr-1" />
								{:else}<Clock size={16} class="mr-1" />{/if}
								{orderData.status}
							</span>
						</div>
					</div>

					<div class="border-t border-cream-200 dark:border-[#3f4946] pt-6 mb-6">
						<h3 class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">{$locale === 'sv' ? 'Orderdetaljer' : 'Order details'}</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p class="text-sm text-forest-500 dark:text-[#8A9A8A]">{$locale === 'sv' ? 'Ordernummer' : 'Order number'}</p>
								<p class="font-medium text-forest-900 dark:text-[#E8EDE8]">#{orderData.id}</p>
							</div>
							<div>
								<p class="text-sm text-forest-500 dark:text-[#8A9A8A]">{$locale === 'sv' ? 'Orderdatum' : 'Order date'}</p>
								<p class="font-medium text-forest-900 dark:text-[#E8EDE8]">{formatDate(orderData.createdAt)}</p>
							</div>
							<div>
								<p class="text-sm text-forest-500 dark:text-[#8A9A8A]">{$locale === 'sv' ? 'Totalt' : 'Total'}</p>
								<p class="font-medium text-forest-900 dark:text-[#E8EDE8]">{orderData.total} SEK</p>
							</div>
							<div>
								<p class="text-sm text-forest-500 dark:text-[#8A9A8A]">{$locale === 'sv' ? 'Fraktfirma' : 'Carrier'}</p>
								<p class="font-medium text-forest-900 dark:text-[#E8EDE8]">{orderData.carrier || 'PostNord'}</p>
							</div>
						</div>
					</div>

					{#if orderData.trackingNumber}
						<div class="border-t border-cream-200 dark:border-[#3f4946] pt-6 mb-6">
							<h3 class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">{$locale === 'sv' ? 'Spårningsinformation' : 'Tracking information'}</h3>
							<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
								<p class="text-sm text-forest-600 dark:text-[#B8C5B8] mb-2">{$locale === 'sv' ? 'Spårningsnummer:' : 'Tracking number:'}</p>
								<p class="font-mono font-semibold text-forest-900 dark:text-[#E8EDE8] text-lg mb-4">{orderData.trackingNumber}</p>
								<a href={getTrackingUrl(orderData.carrier || 'PostNord', orderData.trackingNumber)} target="_blank" rel="noopener noreferrer"
									class="inline-flex items-center px-6 py-3 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors">
									<Truck size={20} class="mr-2" />
									{$locale === 'sv' ? 'Spåra paket på ' : 'Track package on '}{orderData.carrier || 'PostNord'}
								</a>
							</div>
						</div>
					{:else}
						<div class="border-t border-cream-200 dark:border-[#3f4946] pt-6 mb-6">
							<div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
								<p class="text-yellow-800 dark:text-yellow-300">
									{$locale === 'sv' ? 'Spårningsnummer har ännu inte tilldelats. Detta kommer att uppdateras när din beställning har skickats.' : 'Tracking number has not been assigned yet. This will be updated when your order has been shipped.'}
								</p>
							</div>
						</div>
					{/if}

					<div class="flex flex-col sm:flex-row gap-4 pt-6 border-t border-cream-200 dark:border-[#3f4946]">
						<a href="/account/orders" class="flex-1 text-center px-6 py-3 border border-sage-600 text-sage-600 font-medium rounded-lg hover:bg-sage-50 transition-colors">
							{$locale === 'sv' ? 'Visa alla beställningar' : 'View all orders'}
						</a>
						<a href="/contact" class="flex-1 text-center px-6 py-3 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors">
							{$locale === 'sv' ? 'Kontakta kundservice' : 'Contact support'}
						</a>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
