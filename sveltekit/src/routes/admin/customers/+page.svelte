<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Search, User, Mail, Phone, Calendar, ShoppingBag, Eye, Trash2 } from 'lucide-svelte';

	let customers: any[] = [];
	let loading = true;
	let error = false;
	let searchQuery = '';
	let statusFilter: 'all' | 'active' | 'inactive' = 'all';
	let sortBy: 'name' | 'orders' | 'spent' | 'recent' = 'recent';
	let deleteConfirm: { id: string; name: string } | null = null;

	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);
	const getStatusColor = (s: string) => s === 'active'
		? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
		: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#343c39] dark:text-[#8A9A8A] dark:border-[#4a5552]';

	async function fetchCustomers() {
		loading = true; error = false;
		try {
			const res = await fetch('/api/customers');
			const data = await res.json();
			if (data.success) customers = data.data || [];
			else { error = true; toast.error('Failed to load customers'); }
		} catch { error = true; toast.error('Failed to load customers'); } finally { loading = false; }
	}

	onMount(fetchCustomers);

	$: statistics = {
		total: customers.length,
		active: customers.filter(c => c.status === 'active').length,
		inactive: customers.filter(c => c.status === 'inactive').length,
		newsletter: customers.filter(c => c.newsletter).length,
		avgOrderValue: (() => { const t = customers.reduce((s, c) => s + c.totalSpent, 0); const o = customers.reduce((s, c) => s + c.totalOrders, 0); return o > 0 ? t / o : 0; })(),
	};

	$: filteredCustomers = customers
		.filter(c => {
			const q = searchQuery.toLowerCase();
			const matchSearch = !searchQuery || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q);
			const matchStatus = statusFilter === 'all' || c.status === statusFilter;
			return matchSearch && matchStatus;
		})
		.sort((a, b) => {
			if (sortBy === 'name') return a.name?.localeCompare(b.name);
			if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
			if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

	async function handleDelete(id: string) {
		deleteConfirm = null;
		try {
			const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
			if (res.ok) { customers = customers.filter(c => c.id !== id); toast.success('Customer deleted successfully'); }
			else toast.error('Failed to delete customer');
		} catch { toast.error('Failed to delete customer'); }
	}
</script>

<Toast />
<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Customers</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Manage your customer database</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64"><div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
	{:else if error}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<p class="text-red-600 dark:text-red-400">Failed to load customers</p>
			<button on:click={fetchCustomers} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">Retry</button>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4">
			{#each [
				{ label: 'Total Customers', value: statistics.total, icon: User, color: 'text-blue-500' },
				{ label: 'Active', value: statistics.active, icon: User, color: 'text-green-500' },
				{ label: 'Inactive', value: statistics.inactive, icon: User, color: 'text-forest-400' },
				{ label: 'Newsletter', value: statistics.newsletter, icon: Mail, color: 'text-sage-500' },
				{ label: 'Avg Order Value', value: formatPrice(statistics.avgOrderValue), icon: ShoppingBag, color: 'text-yellow-500' },
			] as card}
				<div class="bg-white dark:bg-[#242a28] rounded-xl p-4 shadow-soft">
					<div class="flex items-center justify-between mb-2">
						<span class="text-sm text-forest-600 dark:text-[#C5D4C5]">{card.label}</span>
						<card.icon size={20} class={card.color} />
					</div>
					<p class="text-2xl font-bold text-forest-800 dark:text-[#E8EDE8]">{card.value}</p>
				</div>
			{/each}
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="md:col-span-2 relative">
					<Search size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 dark:text-[#6B7B6B]" />
					<input type="text" placeholder="Search by name, email, or phone..." bind:value={searchQuery}
						class="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none" />
				</div>
				<select bind:value={statusFilter} class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none">
					<option value="all">All Status</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</select>
				<select bind:value={sortBy} class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none">
					<option value="recent">Most Recent</option>
					<option value="name">Name (A-Z)</option>
					<option value="orders">Most Orders</option>
					<option value="spent">Highest Spent</option>
				</select>
			</div>
			<p class="mt-4 text-sm text-forest-600 dark:text-[#8A9A8A]">Showing {filteredCustomers.length} of {customers.length} customers</p>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
			{#if filteredCustomers.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
							<tr>
								{#each ['Customer', 'Contact', 'Orders', 'Total Spent', 'Status', 'Joined', 'Actions'] as th}
									<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">{th}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-cream-200 dark:divide-[#3f4946]">
							{#each filteredCustomers as customer}
								<tr class="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
									<td class="px-6 py-4">
										<div class="flex items-center gap-3">
											<div class="w-10 h-10 rounded-full bg-sage-100 dark:bg-[#2a3330] flex items-center justify-center">
												<User size={20} class="text-sage-700 dark:text-sage-400" />
											</div>
											<div>
												<div class="font-medium text-forest-800 dark:text-[#E8EDE8]">{customer.name}</div>
												{#if customer.newsletter}<span class="inline-flex items-center gap-1 text-xs text-sage-600 dark:text-sage-400"><Mail size={12} />Newsletter</span>{/if}
											</div>
										</div>
									</td>
									<td class="px-6 py-4">
										<div class="text-sm">
											<div class="flex items-center gap-2 text-forest-700 dark:text-[#C5D4C5]"><Mail size={16} class="text-forest-400" />{customer.email}</div>
											{#if customer.phone}<div class="flex items-center gap-2 text-forest-600 dark:text-[#8A9A8A] mt-1"><Phone size={16} class="text-forest-400" />{customer.phone}</div>{/if}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center gap-2"><ShoppingBag size={16} class="text-forest-400" /><span class="font-medium text-forest-800 dark:text-[#E8EDE8]">{customer.totalOrders}</span></div>
										{#if customer.lastOrderDate}<div class="text-xs text-forest-600 dark:text-[#8A9A8A] mt-1">Last: {new Date(customer.lastOrderDate).toLocaleDateString('sv-SE')}</div>{/if}
									</td>
									<td class="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">{formatPrice(customer.totalSpent)}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium border {getStatusColor(customer.status)}">{customer.status}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center gap-2 text-sm text-forest-600 dark:text-[#8A9A8A]">
											<Calendar size={16} class="text-forest-400" />{new Date(customer.createdAt).toLocaleDateString('sv-SE')}
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center gap-2">
											<a href="/admin/customers/{customer.id}" class="p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 dark:text-sage-400 transition-colors"><Eye size={20} /></a>
											<button on:click={() => deleteConfirm = { id: customer.id, name: customer.name }} class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"><Trash2 size={20} /></button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center text-forest-600 dark:text-[#C5D4C5]">
					<User size={48} class="mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
					<p>No customers found</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if deleteConfirm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
			<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Delete customer?</h3>
			<p class="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">Are you sure you want to delete <span class="font-medium">{deleteConfirm.name}</span>? This cannot be undone.</p>
			<div class="flex gap-3">
				<button on:click={() => handleDelete(deleteConfirm!.id)} class="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Delete</button>
				<button on:click={() => deleteConfirm = null} class="flex-1 px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330]">Cancel</button>
			</div>
		</div>
	</div>
{/if}
