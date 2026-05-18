<script lang="ts">
	import { onMount } from 'svelte';
	import { Banknote, ShoppingBag, Users, BarChart2, TrendingUp, TrendingDown, Calendar } from 'lucide-svelte';

	let analytics: any = null;
	let loading = true;
	let error = false;
	let timeRange: 'week' | 'month' | 'year' = 'month';

	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	const categoryNames: Record<string, string> = {
		'essential-oils': 'Eteriska oljor', 'carrier-oils': 'Bäraroljor',
		'diffusers': 'Diffusers', 'accessories': 'Tillbehör', 'gift-sets': 'Presentset',
	};
	const categoryColors: Record<string, string> = {
		'essential-oils': 'bg-sage-500', 'carrier-oils': 'bg-orange-500',
		'diffusers': 'bg-yellow-500', 'accessories': 'bg-forest-500', 'gift-sets': 'bg-rose-500',
	};

	async function fetchAnalytics() {
		loading = true; error = false;
		try {
			const res = await fetch(`/api/analytics?range=${timeRange}`);
			const data = await res.json();
			if (data.success) analytics = data.data;
			else error = true;
		} catch { error = true; } finally { loading = false; }
	}

	onMount(fetchAnalytics);
	$: timeRange, fetchAnalytics();

	$: maxRevenue = analytics ? Math.max(...(analytics.recentSales?.map((s: any) => s.revenue) ?? [1]), 1) : 1;
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Analytics</h1>
			<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Track your business performance</p>
		</div>
		<div class="flex gap-2 bg-white dark:bg-[#242a28] rounded-xl p-1 shadow-soft">
			{#each [['week', 'Week'], ['month', 'Month'], ['year', 'Year']] as [range, label]}
				<button on:click={() => timeRange = range as 'week' | 'month' | 'year'}
					class="px-4 py-2 rounded-lg font-medium transition-all {timeRange === range ? 'bg-sage-600 text-white' : 'text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-50 dark:hover:bg-[#2a3330]'}">
					{label}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if error || !analytics}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<p class="text-forest-600 dark:text-[#C5D4C5]">Failed to load analytics data</p>
			<button on:click={fetchAnalytics} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors">Retry</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each [
				{ key: 'revenue', label: 'Total Revenue', icon: Banknote, color: 'bg-green-500', data: analytics.revenue },
				{ key: 'orders', label: 'Total Orders', icon: ShoppingBag, color: 'bg-blue-500', data: analytics.orders },
				{ key: 'customers', label: 'Total Customers', icon: Users, color: 'bg-purple-500', data: analytics.customers },
			] as card}
				<div class="bg-white dark:bg-[#242a28] rounded-2xl p-6 shadow-soft">
					<div class="flex items-center justify-between mb-4">
						<div class="w-12 h-12 rounded-xl {card.color} flex items-center justify-center">
							<card.icon size={24} class="text-white" />
						</div>
						<div class="flex items-center gap-1 text-sm font-medium {card.data.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
							{#if card.data.change >= 0}<TrendingUp size={16} />{:else}<TrendingDown size={16} />{/if}
							{Math.abs(card.data.change)}%
						</div>
					</div>
					<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">{card.label}</p>
					<p class="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8] mb-2">
						{card.key === 'revenue' ? formatPrice(card.data.total) : card.data.total}
					</p>
					<div class="text-xs text-forest-600 dark:text-[#8A9A8A] space-y-1">
						{#if card.key === 'revenue'}
							<p>Today: {formatPrice(card.data.today)}</p>
							<p>This week: {formatPrice(card.data.thisWeek)}</p>
							<p>This month: {formatPrice(card.data.thisMonth)}</p>
						{:else if card.key === 'orders'}
							<p>Today: {card.data.today}</p>
							<p>This week: {card.data.thisWeek}</p>
							<p>This month: {card.data.thisMonth}</p>
						{:else}
							<p>New: {card.data.new}</p>
							<p>Returning: {card.data.returning}</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
				<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-6 flex items-center gap-2">
					<BarChart2 size={24} class="text-sage-600" />Revenue by Category
				</h2>
				{#if analytics.revenueByCategory?.length === 0}
					<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">No category data available.</p>
				{:else}
					<div class="space-y-4">
						{#each analytics.revenueByCategory ?? [] as cat}
							<div>
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm font-medium text-forest-700 dark:text-[#C5D4C5]">{categoryNames[cat.category] || cat.category}</span>
									<div class="flex items-center gap-3">
										<span class="text-sm text-forest-600 dark:text-[#8A9A8A]">{cat.percentage.toFixed(1)}%</span>
										<span class="text-sm font-bold text-forest-800 dark:text-[#E8EDE8]">{formatPrice(cat.revenue)}</span>
									</div>
								</div>
								<div class="h-3 bg-cream-200 dark:bg-[#343c39] rounded-full overflow-hidden">
									<div class="h-full {categoryColors[cat.category] || 'bg-sage-500'} transition-all" style="width: {cat.percentage}%"></div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] flex items-center gap-2">
						<TrendingUp size={24} class="text-sage-600" />Top Selling Products
					</h2>
					<span class="text-sm text-forest-600 dark:text-[#8A9A8A]">{analytics.products?.totalSold ?? 0} units total</span>
				</div>
				{#if analytics.products?.topSelling?.length === 0}
					<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">No products sold yet.</p>
				{:else}
					<div class="space-y-4">
						{#each analytics.products?.topSelling ?? [] as product, i}
							<div class="flex items-center gap-4 p-4 rounded-xl hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
								<div class="w-8 h-8 rounded-full bg-sage-100 dark:bg-[#2a3330] flex items-center justify-center flex-shrink-0">
									<span class="text-sm font-bold text-sage-700 dark:text-sage-400">#{i + 1}</span>
								</div>
								<div class="flex-1 min-w-0">
									<p class="font-medium text-forest-800 dark:text-[#E8EDE8] truncate">{product.name}</p>
									<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">{product.quantity} units sold</p>
								</div>
								<p class="font-bold text-forest-800 dark:text-[#E8EDE8]">{formatPrice(product.revenue)}</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
			<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-6 flex items-center gap-2">
				<Calendar size={24} class="text-sage-600" />Sales Overview
			</h2>
			{#if analytics.recentSales?.length === 0}
				<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">No sales data available.</p>
			{:else}
				<div class="space-y-3">
					{#each analytics.recentSales ?? [] as sale}
						<div class="flex items-center gap-4">
							<span class="text-sm text-forest-600 dark:text-[#8A9A8A] w-24 flex-shrink-0">
								{new Date(sale.date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
							</span>
							<div class="flex-1 h-8 bg-cream-200 dark:bg-[#343c39] rounded-lg overflow-hidden">
								<div class="h-full bg-gradient-to-r from-sage-500 to-sage-600 transition-all" style="width: {(sale.revenue / maxRevenue) * 100}%"></div>
							</div>
							<span class="text-sm font-medium text-forest-800 dark:text-[#E8EDE8] w-28 text-right flex-shrink-0">{formatPrice(sale.revenue)}</span>
							<span class="text-sm text-forest-600 dark:text-[#8A9A8A] w-16 text-right flex-shrink-0">{sale.orders} orders</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
