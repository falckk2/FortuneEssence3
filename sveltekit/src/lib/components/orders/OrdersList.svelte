<script lang="ts">
	import { onMount } from 'svelte';
	import { ClipboardList } from 'lucide-svelte';
	import OrderCard from './OrderCard.svelte';

	let { locale = 'sv' }: { locale?: string } = $props();

	let orders: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let filter = $state('all');

	async function fetchOrders() {
		loading = true; error = '';
		try {
			const res = await fetch('/api/orders?action=user-orders');
			if (!res.ok) throw new Error('Failed to fetch orders');
			const data = await res.json();
			if (data.success) orders = data.data;
			else error = data.error || 'Failed to load orders';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load orders';
		} finally { loading = false; }
	}

	async function handleCancelOrder(orderId: string) {
		const res = await fetch(`/api/orders/${orderId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'cancelled' }),
		});
		const data = await res.json();
		if (data.success) orders = orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o);
		else throw new Error(data.error || 'Failed to cancel order');
	}

	onMount(fetchOrders);

	const counts = $derived({
		all: orders.length,
		pending: orders.filter(o => o.status === 'pending').length,
		confirmed: orders.filter(o => o.status === 'confirmed').length,
		shipped: orders.filter(o => o.status === 'shipped').length,
		delivered: orders.filter(o => o.status === 'delivered').length,
		cancelled: orders.filter(o => o.status === 'cancelled').length,
	});

	const filteredOrders = $derived(
		filter === 'all' ? orders : orders.filter(o => o.status.toLowerCase() === filter)
	);

	const tabs = $derived([
		{ key: 'all', label: locale === 'sv' ? 'Alla' : 'All', count: counts.all },
		{ key: 'pending', label: locale === 'sv' ? 'Väntar' : 'Pending', count: counts.pending },
		{ key: 'confirmed', label: locale === 'sv' ? 'Bekräftade' : 'Confirmed', count: counts.confirmed },
		{ key: 'shipped', label: locale === 'sv' ? 'Skickade' : 'Shipped', count: counts.shipped },
		{ key: 'delivered', label: locale === 'sv' ? 'Levererade' : 'Delivered', count: counts.delivered },
		{ key: 'cancelled', label: locale === 'sv' ? 'Avbrutna' : 'Cancelled', count: counts.cancelled },
	]);
</script>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600 dark:border-sage-400"></div>
		<span class="ml-3 text-forest-600 dark:text-[#C5D4C5]">
			{locale === 'sv' ? 'Laddar beställningar...' : 'Loading orders...'}
		</span>
	</div>
{:else if error}
	<div class="text-center py-12">
		<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-6 py-4 rounded-lg inline-block">
			{error}
		</div>
		<button on:click={fetchOrders}
			class="mt-4 block mx-auto px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors">
			{locale === 'sv' ? 'Försök igen' : 'Try again'}
		</button>
	</div>
{:else if orders.length === 0}
	<div class="text-center py-12">
		<ClipboardList size={64} class="text-[#8A9A8A] dark:text-[#6B7B6B] mx-auto mb-4" />
		<h3 class="text-lg font-medium text-forest-900 dark:text-[#E8EDE8] mb-2">
			{locale === 'sv' ? 'Inga beställningar än' : 'No orders yet'}
		</h3>
		<p class="text-forest-600 dark:text-[#C5D4C5] mb-6">
			{locale === 'sv' ? 'När du gör din första beställning kommer den att visas här.' : 'When you make your first order, it will appear here.'}
		</p>
		<a href="/products"
			class="inline-flex items-center px-6 py-3 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors">
			{locale === 'sv' ? 'Börja handla' : 'Start shopping'}
		</a>
	</div>
{:else}
	<div class="space-y-6">
		<div class="border-b border-cream-200 dark:border-[#3f4946]">
			<nav class="-mb-px flex space-x-8 overflow-x-auto">
				{#each tabs as tab}
					<button on:click={() => filter = tab.key}
						class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center {filter === tab.key ? 'border-sage-600 dark:border-sage-400 text-sage-700 dark:text-sage-400' : 'border-transparent text-forest-500 dark:text-[#8A9A8A] hover:text-forest-700 dark:hover:text-[#C5D4C5] hover:border-cream-400'}">
						{tab.label}
						{#if tab.count > 0}
							<span class="ml-2 py-0.5 px-2 rounded-full text-xs {filter === tab.key ? 'bg-sage-600/10 dark:bg-sage-400/20 text-sage-700 dark:text-sage-400' : 'bg-cream-100 dark:bg-[#2a3330] text-forest-600 dark:text-[#C5D4C5]'}">
								{tab.count}
							</span>
						{/if}
					</button>
				{/each}
			</nav>
		</div>

		{#if filteredOrders.length === 0}
			<div class="text-center py-12">
				<p class="text-forest-600 dark:text-[#C5D4C5]">
					{locale === 'sv' ? `Inga beställningar med status "${filter}".` : `No orders with status "${filter}".`}
				</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredOrders as order (order.id)}
					<OrderCard {order} {locale} onCancel={handleCancelOrder} />
				{/each}
			</div>
		{/if}

		{#if filteredOrders.length >= 20}
			<div class="text-center pt-6">
				<button class="px-6 py-2 border border-cream-300 dark:border-[#4a5552] text-forest-600 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors">
					{locale === 'sv' ? 'Ladda fler beställningar' : 'Load more orders'}
				</button>
			</div>
		{/if}
	</div>
{/if}
