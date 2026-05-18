<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Archive, AlertTriangle, XCircle, Lock, Pencil, Check, X } from 'lucide-svelte';

	let items: any[] = [];
	let report: any = null;
	let lowStockIds: string[] = [];
	let loading = true;
	let error = false;
	let adjustModal: { productId: string; productName: string; currentQty: number } | null = null;
	let adjustDelta = '';
	let adjustReason = '';
	let adjusting = false;
	let editReorderRow: string | null = null;
	let editReorderValue = '';

	async function fetchInventory() {
		loading = true; error = false;
		try {
			const res = await fetch('/api/inventory');
			const data = await res.json();
			if (data.success) { items = data.data.items; report = data.data.report; lowStockIds = data.data.lowStockIds; }
			else { error = true; toast.error(data.error || 'Failed to load inventory'); }
		} catch { error = true; toast.error('Failed to load inventory'); } finally { loading = false; }
	}

	onMount(fetchInventory);

	function getRowStyle(item: any) {
		if (item.quantity === 0) return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-l-red-400';
		if (lowStockIds.includes(item.productId)) return 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-400';
		return '';
	}

	async function handleAdjust() {
		if (!adjustModal) return;
		const delta = parseInt(adjustDelta);
		if (isNaN(delta) || delta === 0) { toast.error('Enter a non-zero adjustment value'); return; }
		adjusting = true;
		try {
			const res = await fetch(`/api/inventory?productId=${adjustModal.productId}`, {
				method: 'PATCH', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ adjustment: delta, reason: adjustReason }),
			});
			const data = await res.json();
			if (data.success) { toast.success('Stock adjusted'); adjustModal = null; adjustDelta = ''; adjustReason = ''; fetchInventory(); }
			else toast.error(data.error || 'Failed to adjust stock');
		} catch { toast.error('Failed to adjust stock'); } finally { adjusting = false; }
	}

	async function handleSaveReorder(productId: string) {
		const level = parseInt(editReorderValue);
		if (isNaN(level) || level < 0) { toast.error('Enter a valid reorder level'); return; }
		try {
			const res = await fetch(`/api/inventory?productId=${productId}`, {
				method: 'PUT', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reorderLevel: level }),
			});
			const data = await res.json();
			if (data.success) { toast.success('Reorder level updated'); editReorderRow = null; fetchInventory(); }
			else toast.error(data.error || 'Failed to update reorder level');
		} catch { toast.error('Failed to update reorder level'); }
	}
</script>

<Toast />
<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Inventory</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Monitor and manage stock levels</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64"><div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
	{:else if error}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<p class="text-red-600 dark:text-red-400">Failed to load inventory</p>
			<button on:click={fetchInventory} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">Retry</button>
		</div>
	{:else}
		{#if report}
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
					<div class="flex items-center gap-3 mb-2"><Archive size={24} class="text-sage-600" /><span class="text-sm text-forest-600 dark:text-[#C5D4C5]">Total Products</span></div>
					<p class="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8]">{report.totalProducts}</p>
				</div>
				<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
					<div class="flex items-center gap-3 mb-2"><AlertTriangle size={24} class="text-yellow-500" /><span class="text-sm text-forest-600 dark:text-[#C5D4C5]">Low Stock</span></div>
					<p class="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{report.lowStockCount}</p>
				</div>
				<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
					<div class="flex items-center gap-3 mb-2"><XCircle size={24} class="text-red-500" /><span class="text-sm text-forest-600 dark:text-[#C5D4C5]">Out of Stock</span></div>
					<p class="text-3xl font-bold text-red-600 dark:text-red-400">{report.outOfStockCount}</p>
				</div>
				<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-5">
					<div class="flex items-center gap-3 mb-2"><Lock size={24} class="text-forest-500 dark:text-[#8A9A8A]" /><span class="text-sm text-forest-600 dark:text-[#C5D4C5]">Reserved</span></div>
					<p class="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8]">{report.reservedStock}</p>
				</div>
			</div>
		{/if}

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
			{#if items.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
							<tr>
								{#each ['Product', 'SKU', 'Available', 'Reserved', 'Reorder Level', 'Status', 'Actions'] as th}
									<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">{th}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-cream-200 dark:divide-[#3f4946]">
							{#each items as item}
								<tr class="transition-colors hover:bg-cream-50 dark:hover:bg-[#2a3330] {getRowStyle(item)}">
									<td class="px-6 py-4">
										<p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{item.product?.nameSv || item.productId}</p>
										{#if item.product?.nameEn && item.product.nameEn !== item.product.nameSv}
											<p class="text-xs text-forest-500 dark:text-[#6B7B6B]">{item.product.nameEn}</p>
										{/if}
									</td>
									<td class="px-6 py-4 text-sm text-forest-600 dark:text-[#8A9A8A] font-mono">{item.product?.sku || '—'}</td>
									<td class="px-6 py-4 font-semibold text-forest-800 dark:text-[#E8EDE8]">{item.quantity - item.reservedQuantity}</td>
									<td class="px-6 py-4 text-forest-600 dark:text-[#C5D4C5]">{item.reservedQuantity}</td>
									<td class="px-6 py-4">
										{#if editReorderRow === item.productId}
											<div class="flex items-center gap-2">
												<input type="number" min="0" bind:value={editReorderValue}
													class="w-20 px-2 py-1 text-sm rounded-lg border-2 border-sage-400 focus:outline-none bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8]" />
												<button on:click={() => handleSaveReorder(item.productId)} class="p-1 text-green-600 dark:text-green-400"><Check size={16} /></button>
												<button on:click={() => editReorderRow = null} class="p-1 text-red-500 dark:text-red-400"><X size={16} /></button>
											</div>
										{:else}
											<span class="text-forest-600 dark:text-[#C5D4C5]">{item.reorderLevel}</span>
										{/if}
									</td>
									<td class="px-6 py-4">
										{#if item.quantity === 0}
											<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
												<XCircle size={12} />Out of Stock
											</span>
										{:else if lowStockIds.includes(item.productId)}
											<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700">
												<AlertTriangle size={12} />Low Stock
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">In Stock</span>
										{/if}
									</td>
									<td class="px-6 py-4">
										<div class="flex items-center gap-2">
											<button on:click={() => adjustModal = { productId: item.productId, productName: item.product?.nameSv || item.productId, currentQty: item.quantity }}
												class="px-3 py-1.5 text-xs font-medium rounded-lg bg-sage-100 dark:bg-[#2a3330] text-sage-700 dark:text-sage-400 hover:bg-sage-200 transition-colors">
												Adjust Stock
											</button>
											<button on:click={() => { editReorderRow = item.productId; editReorderValue = String(item.reorderLevel); }}
												class="p-1.5 rounded-lg hover:bg-cream-100 dark:hover:bg-[#343c39] text-forest-500 dark:text-[#8A9A8A] transition-colors">
												<Pencil size={16} />
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center text-forest-500 dark:text-[#8A9A8A]">
					<Archive size={48} class="mx-auto mb-4 text-forest-300 dark:text-[#6B7B6B]" />
					<p>No inventory records found</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if adjustModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-1">Adjust Stock</h2>
			<p class="text-sm text-forest-600 dark:text-[#C5D4C5] mb-4"><strong>{adjustModal.productName}</strong> — current quantity: {adjustModal.currentQty}</p>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Adjustment (positive = add, negative = remove)</label>
					<input type="number" bind:value={adjustDelta} class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none" placeholder="e.g. +10 or -5" />
				</div>
				<div>
					<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Reason (optional)</label>
					<input type="text" bind:value={adjustReason} class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none" placeholder="e.g. Restock delivery" />
				</div>
				<div class="flex gap-3 justify-end">
					<button on:click={() => { adjustModal = null; adjustDelta = ''; adjustReason = ''; }}
						class="px-5 py-2 rounded-full border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium hover:bg-cream-100 transition-all">Cancel</button>
					<button on:click={handleAdjust} disabled={adjusting}
						class="px-5 py-2 rounded-full bg-sage-600 text-white font-medium hover:bg-sage-700 transition-all disabled:opacity-50">
						{adjusting ? 'Saving...' : 'Apply'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
