<script lang="ts">
	import { onMount } from 'svelte';
	import { ShoppingBag, Banknote, AlertTriangle, Box, TrendingUp, TrendingDown } from 'lucide-svelte';

	let stats: any = null;
	let recentOrders: any[] = [];
	let loading = true;
	let error = false;

	const statusLabels: Record<string, string> = {
		pending: 'Väntande', confirmed: 'Bekräftad', shipped: 'Skickad',
		delivered: 'Levererad', cancelled: 'Avbruten',
	};
	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
		confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
		shipped: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
		delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
		cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
	};
	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	async function fetchData() {
		loading = true; error = false;
		try {
			const [sRes, oRes] = await Promise.all([
				fetch('/api/orders?action=statistics'),
				fetch('/api/orders?action=recent&limit=5'),
			]);
			const [sData, oData] = await Promise.all([sRes.json(), oRes.json()]);
			if (sData.success && oData.success) {
				const orderStats = sData.data;
				const totalOrders = Object.values(orderStats).reduce((s: number, c) => s + (c as number), 0);
				stats = { totalOrders, pendingOrders: orderStats.pending || 0, revenue: 0, lowStockProducts: 0, ordersTrend: 12, revenueTrend: 8 };
				recentOrders = oData.data || [];
			} else { error = true; }
		} catch { error = true; } finally { loading = false; }
	}

	onMount(fetchData);

	$: statCards = stats ? [
		{ name: 'Totala beställningar', value: stats.totalOrders, change: stats.ordersTrend, icon: ShoppingBag, color: 'bg-blue-500', link: '/admin/orders' },
		{ name: 'Väntande beställningar', value: stats.pendingOrders, change: 0, icon: AlertTriangle, color: 'bg-yellow-500', link: '/admin/orders?status=pending' },
		{ name: 'Intäkter', value: formatPrice(stats.revenue), change: stats.revenueTrend, icon: Banknote, color: 'bg-green-500', link: '/admin/analytics' },
		{ name: 'Lågt lager', value: stats.lowStockProducts, change: 0, icon: Box, color: 'bg-red-500', link: '/admin/products?filter=low-stock' },
	] : [];
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Översikt</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Välkommen till adminpanelen</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<p class="text-forest-600 dark:text-[#C5D4C5]">Kunde inte ladda dashboarddata</p>
			<button on:click={fetchData} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors">Försök igen</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each statCards as card}
				<a href={card.link} class="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 border border-transparent dark:border-[#3f4946]">
					<div class="flex items-center justify-between mb-4">
						<div class="w-12 h-12 rounded-xl {card.color} flex items-center justify-center">
							<card.icon size={24} class="text-white" />
						</div>
						{#if card.change !== 0}
							<div class="flex items-center gap-1 text-sm font-medium {card.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
								{#if card.change > 0}<TrendingUp size={16} />{:else}<TrendingDown size={16} />{/if}
								{Math.abs(card.change)}%
							</div>
						{/if}
					</div>
					<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">{card.name}</p>
					<p class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{card.value}</p>
				</a>
			{/each}
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden border border-transparent dark:border-[#3f4946]">
			<div class="px-6 py-4 border-b border-cream-200 dark:border-[#3f4946] flex items-center justify-between">
				<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8]">Senaste beställningar</h2>
				<a href="/admin/orders" class="text-sm text-sage-700 dark:text-sage-400 hover:underline font-medium">Visa alla →</a>
			</div>
			{#if recentOrders.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-cream-50 dark:bg-[#2a3330] border-b border-cream-200 dark:border-[#3f4946]">
							<tr>
								{#each ['Order-ID', 'Kund', 'Totalt', 'Status', 'Datum'] as th}
									<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">{th}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="bg-white dark:bg-[#242a28] divide-y divide-cream-200 dark:divide-[#3f4946]">
							{#each recentOrders as order}
								<tr class="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
									<td class="px-6 py-4 whitespace-nowrap">
										<a href="/admin/orders/{order.id}" class="text-sage-700 dark:text-sage-400 hover:underline font-medium">#{order.id.substring(0, 8)}</a>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-forest-700 dark:text-[#C5D4C5]">{order.customer || order.customerName || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">{formatPrice(order.total)}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium border {statusColors[order.status] || 'bg-cream-100 text-forest-700 border-cream-200'}">
											{statusLabels[order.status] || order.status}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-forest-600 dark:text-[#8A9A8A]">
										{new Date(order.date || order.createdAt).toLocaleDateString('sv-SE')}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center text-forest-600 dark:text-[#8A9A8A]">
					<ShoppingBag size={48} class="mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
					<p>Inga beställningar ännu</p>
				</div>
			{/if}
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each [
				{ href: '/admin/products', icon: Box, title: 'Hantera produkter', desc: 'Lägg till, redigera eller ta bort produkter' },
				{ href: '/admin/orders', icon: ShoppingBag, title: 'Hantera beställningar', desc: 'Visa och behandla beställningar' },
				{ href: '/admin/customers', icon: null, title: 'Visa kunder', desc: 'Hantera kundkonton' },
			] as card}
				<a href={card.href} class="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft hover:shadow-lg transition-all hover:-translate-y-1 text-center border border-transparent dark:border-[#3f4946]">
					<ShoppingBag size={32} class="mx-auto mb-3 text-sage-600" />
					<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] mb-1">{card.title}</h3>
					<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">{card.desc}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
