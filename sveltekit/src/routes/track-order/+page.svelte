<script lang="ts">
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Truck, CheckCircle, Clock, ShoppingBag, AlertCircle, Search, MapPin, Calendar } from 'lucide-svelte';

	let searchType: 'order' | 'tracking' = 'order';
	let searchValue = '';
	let loading = false;
	let orderData: any = null;
	let error: string | null = null;

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
		confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
		processing: 'bg-sage-100 text-sage-800 border-sage-200',
		shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
		delivered: 'bg-green-100 text-green-800 border-green-200',
		cancelled: 'bg-red-100 text-red-800 border-red-200',
	};

	const statusLabels: Record<string, string> = {
		pending: 'Väntande', confirmed: 'Bekräftad', processing: 'Behandlas',
		shipped: 'Skickad', delivered: 'Levererad', cancelled: 'Avbruten',
	};

	async function handleSearch(e: Event) {
		e.preventDefault();
		if (!searchValue.trim()) { toast.error('Vänligen ange ett ordernummer eller spårningsnummer'); return; }
		loading = true;
		error = null;
		orderData = null;
		try {
			const endpoint = searchType === 'order'
				? `/api/orders/track?orderId=${encodeURIComponent(searchValue)}`
				: `/api/orders/track?trackingNumber=${encodeURIComponent(searchValue)}`;
			const res = await fetch(endpoint);
			const data = await res.json();
			if (data.success && data.data) {
				orderData = data.data;
			} else {
				error = 'Order hittades inte. Kontrollera numret och försök igen.';
				toast.error(error);
			}
		} catch {
			error = 'Ett fel uppstod vid sökning';
			toast.error(error);
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>Spåra beställning – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e]">
	<div class="bg-gradient-to-br from-sage-600 to-forest-700 text-white py-16">
		<div class="container mx-auto px-4">
			<div class="max-w-3xl mx-auto text-center">
				<Truck size={64} class="mx-auto mb-4" />
				<h1 class="text-4xl md:text-5xl font-serif font-bold mb-4">Spåra din beställning</h1>
				<p class="text-xl text-cream-100 mb-8">Ange ditt ordernummer eller spårningsnummer för att se var ditt paket befinner sig</p>

				<div class="bg-white dark:bg-[#2a3330] rounded-2xl shadow-2xl p-6">
					<div class="flex gap-4 mb-4">
						{#each [['order', 'Ordernummer'], ['tracking', 'Spårningsnummer']] as [type, label]}
							<button on:click={() => searchType = type as 'order' | 'tracking'}
								class="flex-1 px-4 py-3 rounded-xl font-semibold transition-all {searchType === type ? 'bg-sage-600 text-white' : 'bg-cream-100 dark:bg-[#343c39] text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-200'}">
								{label}
							</button>
						{/each}
					</div>
					<form on:submit={handleSearch} class="space-y-4">
						<div class="relative">
							<Search size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400" />
							<input type="text" bind:value={searchValue}
								placeholder={searchType === 'order' ? 'Ange ordernummer (t.ex. ORD-12345)' : 'Ange spårningsnummer (t.ex. 1234567890)'}
								class="w-full pl-12 pr-4 py-4 rounded-xl text-forest-800 dark:text-[#E8EDE8] border-2 border-cream-300 dark:border-[#4a5552] focus:border-sage-600 focus:outline-none bg-white dark:bg-[#343c39] text-lg" />
						</div>
						<button type="submit" disabled={loading}
							class="w-full px-8 py-4 rounded-xl bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg disabled:opacity-50 text-lg">
							{loading ? 'Söker...' : 'Spåra beställning'}
						</button>
					</form>
				</div>
			</div>
		</div>
	</div>

	<div class="container mx-auto px-4 py-12">
		<div class="max-w-4xl mx-auto">
			{#if error && !orderData}
				<div class="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
					<AlertCircle size={64} class="mx-auto mb-4 text-red-600 dark:text-red-400" />
					<h2 class="text-2xl font-bold text-red-800 dark:text-red-300 mb-2">Order hittades inte</h2>
					<p class="text-red-700 dark:text-red-400">Kontrollera att du angett rätt ordernummer eller spårningsnummer och försök igen.</p>
				</div>
			{/if}

			{#if orderData}
				<div class="space-y-6">
					<div class="bg-white dark:bg-[#2a3330] rounded-2xl shadow-soft p-6 md:p-8">
						<div class="flex items-start justify-between mb-6">
							<div>
								<h2 class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8] mb-1">Order #{orderData.orderNumber}</h2>
								<p class="text-forest-600 dark:text-[#8A9A8A]">Order-ID: {orderData.orderId}</p>
							</div>
							<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border {statusColors[orderData.status] || 'bg-cream-100 border-cream-200'}">
								{#if orderData.status === 'delivered'}<CheckCircle size={24} />
								{:else if orderData.status === 'shipped'}<Truck size={24} />
								{:else if orderData.status === 'processing'}<ShoppingBag size={24} />
								{:else}<Clock size={24} />{/if}
								<span class="font-semibold">{statusLabels[orderData.status] || orderData.status}</span>
							</div>
						</div>

						{#if orderData.trackingNumber}
							<div class="bg-cream-50 dark:bg-[#343c39] rounded-xl p-6 mb-6">
								<div class="grid md:grid-cols-2 gap-4">
									<div>
										<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Spårningsnummer</p>
										<p class="font-mono font-bold text-forest-800 dark:text-[#E8EDE8]">{orderData.trackingNumber}</p>
									</div>
									{#if orderData.carrier}
										<div>
											<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Fraktbolag</p>
											<p class="font-semibold text-forest-800 dark:text-[#E8EDE8]">{orderData.carrier}</p>
										</div>
									{/if}
								</div>
								{#if orderData.estimatedDelivery}
									<div class="mt-4 pt-4 border-t border-cream-200 dark:border-[#3f4946]">
										<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Beräknad leverans</p>
										<div class="flex items-center gap-2">
											<Calendar size={20} class="text-sage-600" />
											<p class="font-semibold text-forest-800 dark:text-[#E8EDE8]">
												{new Date(orderData.estimatedDelivery).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
											</p>
										</div>
									</div>
								{/if}
							</div>
						{/if}

						{#if orderData.shippingAddress}
							<div class="mb-6">
								<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-3 flex items-center gap-2">
									<MapPin size={20} class="text-sage-600" />Leveransadress
								</h3>
								<div class="bg-cream-50 dark:bg-[#343c39] rounded-xl p-4">
									<p class="text-forest-700 dark:text-[#C5D4C5]">{orderData.shippingAddress.street}</p>
									<p class="text-forest-700 dark:text-[#C5D4C5]">{orderData.shippingAddress.postalCode} {orderData.shippingAddress.city}</p>
									<p class="text-forest-700 dark:text-[#C5D4C5]">{orderData.shippingAddress.country}</p>
								</div>
							</div>
						{/if}

						<div>
							<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-3 flex items-center gap-2">
								<ShoppingBag size={20} class="text-sage-600" />Produkter ({orderData.items?.length ?? 0})
							</h3>
							<div class="space-y-3">
								{#each orderData.items ?? [] as item}
									<div class="flex items-center justify-between bg-cream-50 dark:bg-[#343c39] rounded-xl p-4">
										<div>
											<p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{item.productName}</p>
											<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">Antal: {item.quantity}</p>
										</div>
										<p class="font-semibold text-forest-800 dark:text-[#E8EDE8]">{(item.price * item.quantity).toFixed(2)} kr</p>
									</div>
								{/each}
							</div>
							<div class="mt-4 pt-4 border-t border-cream-200 dark:border-[#3f4946] flex items-center justify-between">
								<p class="font-bold text-forest-800 dark:text-[#E8EDE8] text-lg">Totalt</p>
								<p class="font-bold text-forest-800 dark:text-[#E8EDE8] text-2xl">{orderData.total?.toFixed(2)} kr</p>
							</div>
						</div>
					</div>

					{#if orderData.trackingHistory?.length > 0}
						<div class="bg-white dark:bg-[#2a3330] rounded-2xl shadow-soft p-6 md:p-8">
							<h3 class="font-bold text-forest-800 dark:text-[#E8EDE8] text-xl mb-6">Spårningshistorik</h3>
							<div class="space-y-4">
								{#each orderData.trackingHistory as event, i}
									<div class="flex gap-4">
										<div class="flex flex-col items-center">
											<div class="w-3 h-3 rounded-full {i === 0 ? 'bg-sage-600' : 'bg-cream-300 dark:bg-[#4a5552]'}"></div>
											{#if i < orderData.trackingHistory.length - 1}
												<div class="w-0.5 h-full bg-cream-300 dark:bg-[#4a5552] mt-1"></div>
											{/if}
										</div>
										<div class="flex-1 pb-6">
											<p class="font-semibold text-forest-800 dark:text-[#E8EDE8]">{event.status}</p>
											<p class="text-forest-700 dark:text-[#C5D4C5] mb-1">{event.description}</p>
											<div class="flex items-center gap-4 text-sm text-forest-600 dark:text-[#8A9A8A]">
												<span class="flex items-center gap-1"><MapPin size={16} />{event.location}</span>
												<span class="flex items-center gap-1"><Calendar size={16} />{new Date(event.timestamp).toLocaleString('sv-SE')}</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
