<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Search, Clock, CheckCircle, RefreshCw, Banknote, Inbox, AlertCircle } from 'lucide-svelte';

	let returns: any[] = [];
	let loading = true;
	let error = false;
	let searchQuery = '';
	let statusFilter = 'all';
	let stats: Record<string, number> = {};

	const statusLabels: Record<string, string> = { pending: 'Väntande', approved: 'Godkänd', rejected: 'Avslagen', received: 'Mottagen', refunded: 'Återbetald', cancelled: 'Avbruten' };
	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
		approved: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
		rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
		received: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
		refunded: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
		cancelled: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#343c39] dark:text-[#C5D4C5] dark:border-[#4a5552]',
	};
	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	async function fetchStats() {
		try {
			const res = await fetch('/api/admin/returns?counts=true');
			const data = await res.json();
			if (data.success) stats = data.data || {};
		} catch {}
	}

	async function fetchReturns() {
		loading = true; error = false;
		try {
			const params = new URLSearchParams();
			if (statusFilter !== 'all') params.set('status', statusFilter);
			if (searchQuery) params.set('search', searchQuery);
			const res = await fetch(`/api/admin/returns?${params}`);
			const data = await res.json();
			if (data.success) returns = data.data || [];
			else { toast.error('Kunde inte ladda returer'); error = true; }
		} catch { toast.error('Kunde inte ladda returer'); error = true; } finally { loading = false; }
	}

	onMount(() => { fetchStats(); fetchReturns(); });
	$: statusFilter, fetchReturns();
</script>

<Toast />
<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Returer</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Hantera returer och återbetalningar</p>
	</div>

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		{#each [
			{ key: 'pending', label: 'Väntande', icon: Clock, color: 'text-yellow-600 dark:text-yellow-400' },
			{ key: 'approved', label: 'Godkända', icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400' },
			{ key: 'received', label: 'Mottagna', icon: Inbox, color: 'text-purple-600 dark:text-purple-400' },
			{ key: 'refunded', label: 'Återbetalade', icon: Banknote, color: 'text-green-600 dark:text-green-400' },
		] as card}
			<button on:click={() => statusFilter = statusFilter === card.key ? 'all' : card.key}
				class="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft hover:shadow-lg transition-all text-left border border-transparent dark:border-[#3f4946] {statusFilter === card.key ? 'ring-2 ring-sage-600' : ''}">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm text-forest-600 dark:text-[#C5D4C5]">{card.label}</span>
					<card.icon size={20} class={card.color} />
				</div>
				<p class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{stats[card.key] || 0}</p>
			</button>
		{/each}
	</div>

	<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="relative">
				<Search size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 dark:text-[#8A9A8A]" />
				<input type="text" placeholder="Sök på order-ID, kund..." bind:value={searchQuery}
					on:keydown={e => e.key === 'Enter' && fetchReturns()}
					class="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none" />
			</div>
			<select bind:value={statusFilter} class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none">
				<option value="all">Alla statusar</option>
				{#each Object.entries(statusLabels) as [val, label]}<option value={val}>{label}</option>{/each}
			</select>
		</div>
		<p class="mt-4 text-sm text-forest-600 dark:text-[#8A9A8A]">Visar {returns.length} returer</p>
	</div>

	{#if loading && returns.length === 0}
		<div class="flex items-center justify-center h-64"><div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
	{:else if error && returns.length === 0}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<AlertCircle size={48} class="text-red-500" />
			<p class="text-forest-600 dark:text-[#C5D4C5]">Kunde inte ladda returer</p>
			<button on:click={fetchReturns} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">Försök igen</button>
		</div>
	{:else}
		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden border border-transparent dark:border-[#3f4946]">
			{#if returns.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-cream-50 dark:bg-[#2a3330] border-b border-cream-200 dark:border-[#3f4946]">
							<tr>
								{#each ['Retur-ID', 'Order-ID', 'Kund', 'Artiklar', 'Belopp', 'Status', 'Datum', 'Åtgärder'] as th}
									<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">{th}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-cream-200 dark:divide-[#3f4946]">
							{#each returns as ret}
								<tr class="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
									<td class="px-6 py-4 whitespace-nowrap"><a href="/admin/returns/{ret.id}" class="text-sage-700 dark:text-sage-400 hover:underline font-medium">#{ret.id.substring(0, 8)}</a></td>
									<td class="px-6 py-4 whitespace-nowrap text-forest-700 dark:text-[#C5D4C5]"><a href="/admin/orders/{ret.orderId}" class="hover:underline">#{ret.orderId.substring(0, 8)}</a></td>
									<td class="px-6 py-4 whitespace-nowrap text-forest-700 dark:text-[#C5D4C5]">{ret.customerName || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap text-forest-700 dark:text-[#C5D4C5]">{ret.items?.length || 0} st</td>
									<td class="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">{formatPrice(ret.refundAmount)}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border {statusColors[ret.status] || 'bg-gray-100 text-gray-800'}">
											{statusLabels[ret.status] || ret.status}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-forest-600 dark:text-[#8A9A8A]">{new Date(ret.createdAt).toLocaleDateString('sv-SE')}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<a href="/admin/returns/{ret.id}" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 dark:text-sage-400 transition-colors">Visa</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center text-forest-600 dark:text-[#8A9A8A]">
					<RefreshCw size={48} class="mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
					<p>Inga returer hittades</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
