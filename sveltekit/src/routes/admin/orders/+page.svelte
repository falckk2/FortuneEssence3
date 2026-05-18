<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Search, Eye, Truck, CheckCircle, XCircle, Clock, Archive } from 'lucide-svelte';

	let orders: any[] = [];
	let loading = true;
	let error = '';
	let searchQuery = '';
	let statusFilter = 'all';
	let confirmUpdate: { orderId: string; newStatus: string } | null = null;

	const statusOptions = [
		{ value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' },
		{ value: 'processing', label: 'Processing' }, { value: 'shipped', label: 'Shipped' },
		{ value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' },
	];
	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
		confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
		processing: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
		shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
		delivered: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
		cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
	};
	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	async function fetchOrders() {
		loading = true; error = '';
		try {
			const res = await fetch(`/api/orders?action=recent&days=3650&limit=10000`);
			const data = await res.json();
			if (data.success) orders = data.data || [];
			else { error = 'Failed to load orders'; toast.error(error); }
		} catch { error = 'Failed to load orders'; toast.error(error); } finally { loading = false; }
	}

	onMount(fetchOrders);

	$: statistics = statusOptions.reduce<Record<string, number>>((acc, { value }) => {
		acc[value] = orders.filter(o => o.status === value).length;
		return acc;
	}, {});

	$: filteredOrders = orders.filter(o => {
		const matchSearch = !searchQuery || o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			o.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchStatus = statusFilter === 'all' || o.status === statusFilter;
		return matchSearch && matchStatus;
	});

	async function handleUpdateStatus(orderId: string, newStatus: string) {
		confirmUpdate = null;
		try {
			const res = await fetch(`/api/orders/${orderId}`, {
				method: 'PATCH', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus }),
			});
			if (res.ok) {
				orders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
				toast.success('Order status updated');
			} else { toast.error('Failed to update order status'); }
		} catch { toast.error('Failed to update order status'); }
	}
</script>

<Toast />
<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Orders</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Manage and track customer orders</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64">
			<div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<p class="text-red-600 dark:text-red-400">{error}</p>
			<button on:click={fetchOrders} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors">Retry</button>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
			<button on:click={() => statusFilter = 'all'}
				class="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft hover:shadow-lg transition-all text-left {statusFilter === 'all' ? 'ring-2 ring-sage-600' : ''}">
				<span class="text-sm text-forest-600 dark:text-[#C5D4C5] block mb-2">All</span>
				<p class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{orders.length}</p>
			</button>
			{#each statusOptions as status}
				<button on:click={() => statusFilter = status.value}
					class="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft hover:shadow-lg transition-all text-left {statusFilter === status.value ? 'ring-2 ring-sage-600' : ''}">
					<span class="text-sm text-forest-600 dark:text-[#C5D4C5] block mb-2">{status.label}</span>
					<p class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{statistics[status.value] || 0}</p>
				</button>
			{/each}
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="relative">
					<Search size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 dark:text-[#6B7B6B]" />
					<input type="text" placeholder="Search by order ID, customer, or tracking number..." bind:value={searchQuery}
						class="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] focus:border-sage-600 focus:outline-none" />
				</div>
				<select bind:value={statusFilter}
					class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none">
					<option value="all">All Statuses</option>
					{#each statusOptions as s}<option value={s.value}>{s.label}</option>{/each}
				</select>
			</div>
			<p class="mt-4 text-sm text-forest-600 dark:text-[#8A9A8A]">Showing {filteredOrders.length} of {orders.length} orders</p>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
			{#if filteredOrders.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
							<tr>
								{#each ['Order ID', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Actions'] as th}
									<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">{th}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-cream-200 dark:divide-[#3f4946]">
							{#each filteredOrders as order}
								<tr class="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
									<td class="px-6 py-4 whitespace-nowrap">
										<a href="/admin/orders/{order.id}" class="text-sage-700 hover:underline font-medium">#{order.id.substring(0, 8)}</a>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-forest-700 dark:text-[#C5D4C5]">{order.customerName || 'N/A'}</td>
									<td class="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">{formatPrice(order.total)}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-cream-200 dark:bg-[#343c39] text-forest-700 dark:text-[#C5D4C5]">
											{order.paymentMethod?.replace(/_/g, ' ')}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<select value={order.status}
											on:change={e => confirmUpdate = { orderId: order.id, newStatus: (e.target as HTMLSelectElement).value }}
											class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer {statusColors[order.status] || 'bg-gray-100'}">
											{#each statusOptions as s}<option value={s.value}>{s.label}</option>{/each}
										</select>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-forest-600 dark:text-[#8A9A8A]">
										{new Date(order.createdAt).toLocaleDateString('sv-SE')}
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<a href="/admin/orders/{order.id}" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 transition-colors">
											<Eye size={16} />View
										</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center text-forest-600 dark:text-[#C5D4C5]">
					<Truck size={48} class="mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
					<p>No orders found</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if confirmUpdate}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
			<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Update order status?</h3>
			<p class="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">
				Change order <span class="font-medium">#{confirmUpdate.orderId.substring(0, 8)}</span> to <span class="font-medium capitalize">{confirmUpdate.newStatus}</span>?
			</p>
			<div class="flex gap-3">
				<button on:click={() => handleUpdateStatus(confirmUpdate!.orderId, confirmUpdate!.newStatus)}
					class="flex-1 px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors">Confirm</button>
				<button on:click={() => confirmUpdate = null}
					class="flex-1 px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">Cancel</button>
			</div>
		</div>
	</div>
{/if}
