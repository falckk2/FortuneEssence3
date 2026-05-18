<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ArrowLeft, Clock, CheckCircle, Truck, XCircle, Printer, Archive } from 'lucide-svelte';

	interface Address {
		firstName?: string;
		lastName?: string;
		street: string;
		city: string;
		postalCode: string;
		country: string;
		phone?: string;
	}

	interface OrderItem {
		id: string;
		name: string;
		nameSwedish?: string;
		quantity: number;
		price: number;
		imageUrl?: string;
		sku?: string;
	}

	interface Order {
		id: string;
		status: string;
		createdAt: string;
		totalAmount: number;
		subtotal: number;
		tax: number;
		shippingCost: number;
		paymentMethod: string;
		paymentStatus: string;
		shippingAddress: Address;
		billingAddress: Address;
		trackingNumber?: string;
		estimatedDelivery?: string;
		items: OrderItem[];
	}

	let { data } = $props();
	const session = $derived(data.session);
	const orderId = $derived($page.params.id);

	let order = $state<Order | null>(null);
	let loading = $state(true);
	let error = $state('');
	let cancelling = $state(false);
	let cancelError = $state('');
	let showCancelConfirm = $state(false);

	async function fetchOrder(id: string) {
		loading = true;
		error = '';
		try {
			const res = await fetch(`/api/orders/${id}`);
			if (!res.ok) throw new Error('Order not found');
			const json = await res.json();
			if (json.success) {
				order = json.data;
			} else {
				error = json.error || 'Kunde inte ladda beställning';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Kunde inte ladda beställning';
		} finally {
			loading = false;
		}
	}

	async function handleCancelOrder() {
		if (!order) return;
		cancelling = true;
		cancelError = '';
		try {
			const res = await fetch(`/api/orders/${order.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: 'cancelled' }),
			});
			if (!res.ok) throw new Error('Failed to cancel order');
			const json = await res.json();
			if (json.success) {
				order = { ...order!, status: 'cancelled' };
				showCancelConfirm = false;
			} else {
				throw new Error(json.error || 'Failed to cancel order');
			}
		} catch (err) {
			cancelError = err instanceof Error ? err.message : 'Kunde inte avbryta beställning';
		} finally {
			cancelling = false;
		}
	}

	function getStatusText(status: string): string {
		const map: Record<string, string> = {
			pending: 'Väntar',
			confirmed: 'Bekräftad',
			shipped: 'Skickad',
			delivered: 'Levererad',
			cancelled: 'Avbruten',
		};
		return map[status.toLowerCase()] ?? status;
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleString('sv-SE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(price);
	}

	const canCancel = $derived(
		order != null && ['pending', 'confirmed'].includes(order.status.toLowerCase())
	);

	onMount(() => {
		if (!session?.user) {
			goto(`/auth/signin?callbackUrl=/account/orders/${orderId}`);
			return;
		}
		if (orderId) fetchOrder(orderId);
	});
</script>

<svelte:head>
	<title>Beställning – Fortune Essence</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
	<div class="container mx-auto px-4">

		{#if loading}
			<div class="flex items-center justify-center py-24">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
				<span class="ml-3 text-forest-600 dark:text-[#C5D4C5]">Laddar beställning...</span>
			</div>

		{:else if error}
			<div class="text-center py-24">
				<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-lg inline-block">
					{error}
				</div>
				<div class="mt-6">
					<a href="/account/orders"
						class="inline-flex items-center px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors">
						<ArrowLeft class="h-4 w-4 mr-2" />
						Tillbaka till beställningar
					</a>
				</div>
			</div>

		{:else if order}
			<!-- Header -->
			<div class="mb-8">
				<a href="/account/orders"
					class="inline-flex items-center text-sage-600 hover:text-sage-700 mb-4">
					<ArrowLeft class="h-4 w-4 mr-2" />
					Tillbaka till beställningar
				</a>

				<div class="flex items-center justify-between flex-wrap gap-4">
					<div>
						<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8]">
							Beställning #{order.id}
						</h1>
						<p class="text-forest-600 dark:text-[#C5D4C5] mt-2">
							Beställd den {formatDate(order.createdAt)}
						</p>
					</div>

					<div class="flex items-center gap-3">
						{#if order.status.toLowerCase() === 'pending'}
							<Clock class="w-6 h-6 text-yellow-600" />
						{:else if order.status.toLowerCase() === 'confirmed'}
							<CheckCircle class="w-6 h-6 text-green-600" />
						{:else if order.status.toLowerCase() === 'shipped'}
							<Truck class="w-6 h-6 text-blue-600" />
						{:else if order.status.toLowerCase() === 'delivered'}
							<Archive class="w-6 h-6 text-green-600" />
						{:else if order.status.toLowerCase() === 'cancelled'}
							<XCircle class="w-6 h-6 text-red-600" />
						{:else}
							<Clock class="w-6 h-6 text-forest-600" />
						{/if}
						<span class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8]">
							{getStatusText(order.status)}
						</span>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Main content -->
				<div class="lg:col-span-2 space-y-8">
					<!-- Order Items -->
					<div class="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
						<h2 class="text-xl font-semibold text-forest-900 dark:text-[#E8EDE8] mb-6">
							Beställda produkter
						</h2>
						<div class="space-y-4">
							{#each order.items as item (item.id)}
								<div class="flex items-center gap-4 p-4 border border-cream-200 dark:border-[#3f4946] rounded-lg">
									<div class="flex-shrink-0">
										{#if item.imageUrl}
											<img
												src={item.imageUrl}
												alt={item.name}
												class="w-20 h-20 object-cover rounded-md"
											/>
										{:else}
											<div class="w-20 h-20 bg-cream-200 dark:bg-[#2a3330] rounded-md flex items-center justify-center">
												<span class="text-forest-400 dark:text-[#6B7B6B] text-xs">Ingen bild</span>
											</div>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-forest-900 dark:text-[#E8EDE8]">
											{item.nameSwedish ?? item.name}
										</h3>
										{#if item.sku}
											<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">SKU: {item.sku}</p>
										{/if}
										<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">Antal: {item.quantity}</p>
									</div>

									<div class="text-right">
										<p class="font-semibold text-forest-900 dark:text-[#E8EDE8]">
											{formatPrice(item.price * item.quantity)}
										</p>
										<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">
											{formatPrice(item.price)} per st
										</p>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Tracking -->
					{#if order.trackingNumber}
						<div class="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
							<h2 class="text-xl font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
								Spårningsinformation
							</h2>
							<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
								<div class="flex items-center justify-between gap-4 flex-wrap">
									<div>
										<p class="font-medium text-blue-900 dark:text-blue-300">
											Spårningsnummer: {order.trackingNumber}
										</p>
										{#if order.estimatedDelivery}
											<p class="text-sm text-blue-700 dark:text-blue-400 mt-1">
												Beräknad leverans: {formatDate(order.estimatedDelivery)}
											</p>
										{/if}
									</div>
									<a href="/orders/track?tracking={encodeURIComponent(order.trackingNumber)}"
										class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
										Spåra paket
									</a>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Sidebar -->
				<div class="space-y-6">
					<!-- Order Summary -->
					<div class="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
						<h3 class="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">Ordersammanfattning</h3>
						<div class="space-y-3">
							<div class="flex justify-between">
								<span class="text-forest-600 dark:text-[#C5D4C5]">Subtotal</span>
								<span class="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.subtotal)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-forest-600 dark:text-[#C5D4C5]">Moms (25%)</span>
								<span class="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.tax)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-forest-600 dark:text-[#C5D4C5]">Frakt</span>
								<span class="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.shippingCost)}</span>
							</div>
							<hr class="border-cream-200 dark:border-[#3f4946]" />
							<div class="flex justify-between font-semibold text-lg">
								<span class="text-forest-900 dark:text-[#E8EDE8]">Totalt</span>
								<span class="text-forest-900 dark:text-[#E8EDE8]">{formatPrice(order.totalAmount)}</span>
							</div>
						</div>
					</div>

					<!-- Payment -->
					<div class="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
						<h3 class="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">Betalningsinformation</h3>
						<div class="space-y-3">
							<div>
								<span class="text-forest-600 dark:text-[#C5D4C5]">Betalningsmetod:</span>
								<span class="ml-2 text-forest-900 dark:text-[#E8EDE8] capitalize">{order.paymentMethod}</span>
							</div>
							<div>
								<span class="text-forest-600 dark:text-[#C5D4C5]">Status:</span>
								<span class="ml-2 text-forest-900 dark:text-[#E8EDE8] capitalize">{order.paymentStatus || '—'}</span>
							</div>
						</div>
					</div>

					<!-- Shipping address -->
					<div class="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
						<h3 class="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">Leveransadress</h3>
						<div class="text-forest-700 dark:text-[#C5D4C5] space-y-1">
							<p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
							<p>{order.shippingAddress.street}</p>
							<p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
							<p>{order.shippingAddress.country}</p>
							{#if order.shippingAddress.phone}
								<p>{order.shippingAddress.phone}</p>
							{/if}
						</div>
					</div>

					<!-- Billing address -->
					<div class="bg-white dark:bg-[#242a28] rounded-xl shadow-lg p-6">
						<h3 class="font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">Faktureringsadress</h3>
						{#if order.billingAddress.street === order.shippingAddress.street && order.billingAddress.city === order.shippingAddress.city}
							<p class="text-forest-500 dark:text-[#8A9A8A] text-sm italic">Samma som leveransadress</p>
						{:else}
							<div class="text-forest-700 dark:text-[#C5D4C5] space-y-1">
								<p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
								<p>{order.billingAddress.street}</p>
								<p>{order.billingAddress.postalCode} {order.billingAddress.city}</p>
								<p>{order.billingAddress.country}</p>
								{#if order.billingAddress.phone}
									<p>{order.billingAddress.phone}</p>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Actions -->
					<div class="space-y-3">
						{#if canCancel}
							{#if showCancelConfirm}
								<div class="border border-red-300 dark:border-red-800 rounded-lg p-4 space-y-3">
									<p class="text-sm text-forest-700 dark:text-[#C5D4C5] font-medium">
										Är du säker på att du vill avbryta beställningen?
									</p>
									{#if cancelError}
										<p class="text-sm text-red-600 dark:text-red-400">{cancelError}</p>
									{/if}
									<div class="flex gap-2">
										<button
											onclick={handleCancelOrder}
											disabled={cancelling}
											class="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
											{cancelling ? 'Avbryter...' : 'Ja, avbryt'}
										</button>
										<button
											onclick={() => { showCancelConfirm = false; cancelError = ''; }}
											disabled={cancelling}
											class="flex-1 px-3 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] text-sm font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330] disabled:opacity-50 transition-colors">
											Nej, behåll
										</button>
									</div>
								</div>
							{:else}
								<button
									onclick={() => (showCancelConfirm = true)}
									class="w-full px-4 py-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
									Avbryt beställning
								</button>
							{/if}
						{/if}

						<button
							onclick={() => window.print()}
							class="w-full flex items-center justify-center px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
							<Printer class="h-4 w-4 mr-2" />
							Skriv ut kvitto
						</button>

						<a href="/contact"
							class="w-full text-center block px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors">
							Kontakta support
						</a>
					</div>
				</div>
			</div>
		{/if}

	</div>
</div>
