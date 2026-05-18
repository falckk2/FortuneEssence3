<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';
	import { ArrowLeft } from 'lucide-svelte';

	let { data } = $props();
	const session = $derived(data.session);

	let orders: any[] = [];
	let loading = true;

	onMount(async () => {
		if (!session?.user) { goto('/auth/signin'); return; }
		try {
			const res = await fetch('/api/orders?action=my-orders');
			if (res.ok) { const d = await res.json(); if (d.success) orders = d.data ?? []; }
		} finally { loading = false; }
	});

	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
		confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
		shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
		delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
		cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
	};
	const statusLabels: Record<string, Record<string, string>> = {
		pending: { sv: 'Väntande', en: 'Pending' },
		confirmed: { sv: 'Bekräftad', en: 'Confirmed' },
		shipped: { sv: 'Skickad', en: 'Shipped' },
		delivered: { sv: 'Levererad', en: 'Delivered' },
		cancelled: { sv: 'Avbruten', en: 'Cancelled' },
	};
</script>

<svelte:head><title>{$locale === 'sv' ? 'Mina beställningar' : 'My orders'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-12">
	<div class="container mx-auto px-4 max-w-4xl">
		<a href="/account" class="inline-flex items-center text-forest-600 hover:text-sage-700 mb-6">
			<ArrowLeft size={20} class="mr-2" />{$locale === 'sv' ? 'Tillbaka till konto' : 'Back to account'}
		</a>
		<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8] mb-8">{$locale === 'sv' ? 'Mina beställningar' : 'My orders'}</h1>

		{#if loading}
			<div class="space-y-4">{#each [1,2,3] as _}<div class="h-32 bg-cream-200 dark:bg-[#343c39] rounded-2xl animate-pulse"></div>{/each}</div>
		{:else if orders.length === 0}
			<div class="text-center py-16 bg-white dark:bg-[#2a3330] rounded-2xl shadow-soft">
				<p class="text-5xl mb-4">📦</p>
				<p class="text-xl font-semibold text-forest-700 dark:text-[#C5D4C5] mb-2">{$locale === 'sv' ? 'Inga beställningar ännu' : 'No orders yet'}</p>
				<a href="/products" class="mt-4 inline-block px-6 py-3 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors">{$locale === 'sv' ? 'Börja handla' : 'Start shopping'}</a>
			</div>
		{:else}
			<div class="space-y-4">
				{#each orders as order (order.id)}
					<a href="/account/orders/{order.id}" class="block bg-white dark:bg-[#2a3330] rounded-2xl p-5 shadow-soft hover:shadow-lg transition-all">
						<div class="flex items-start justify-between mb-3">
							<div>
								<p class="font-semibold text-forest-800 dark:text-[#E8EDE8]">#{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}</p>
								<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">{new Date(order.createdAt).toLocaleDateString($locale === 'sv' ? 'sv-SE' : 'en-US')}</p>
							</div>
							<span class="px-3 py-1 rounded-full text-xs font-medium {statusColors[order.status] ?? 'bg-cream-200 text-forest-700'}">
								{statusLabels[order.status]?.[$locale] ?? order.status}
							</span>
						</div>
						<div class="flex items-center justify-between text-sm text-forest-600 dark:text-[#B8C5B8]">
							<span>{order.items?.length ?? 0} {$locale === 'sv' ? 'produkter' : 'items'}</span>
							<span class="font-bold text-forest-800 dark:text-[#E8EDE8]">{order.total?.toFixed(2)} kr</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
