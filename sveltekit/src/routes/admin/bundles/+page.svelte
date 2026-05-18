<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Plus, Pencil, Trash2, Layers } from 'lucide-svelte';

	const CATEGORIES = [
		{ value: 'essential-oils', label: 'Essential Oils' }, { value: 'carrier-oils', label: 'Carrier Oils' },
		{ value: 'diffusers', label: 'Diffusers' }, { value: 'accessories', label: 'Accessories' },
		{ value: 'gift-sets', label: 'Gift Sets' }, { value: 'bundles', label: 'Bundles' },
	];

	let bundles: any[] = [];
	let bundleProducts: any[] = [];
	let loading = true;
	let error = false;
	let modalOpen = false;
	let editingId: string | null = null;
	let saving = false;
	let confirmDelete: string | null = null;
	let form = { bundleProductId: '', requiredQuantity: '3', allowedCategory: 'essential-oils', discountPercentage: '10' };

	async function fetchAll() {
		loading = true; error = false;
		try {
			const [bRes, pRes] = await Promise.all([fetch('/api/bundles'), fetch('/api/products?category=bundles')]);
			const [bData, pData] = await Promise.all([bRes.json(), pRes.json()]);
			if (bData.success) bundles = bData.data || [];
			if (pData.success) bundleProducts = pData.data || [];
		} catch { error = true; toast.error('Failed to load bundles'); } finally { loading = false; }
	}

	onMount(fetchAll);

	function openCreate() { editingId = null; form = { bundleProductId: '', requiredQuantity: '3', allowedCategory: 'essential-oils', discountPercentage: '10' }; modalOpen = true; }
	function openEdit(b: any) { editingId = b.id; form = { bundleProductId: b.bundleProductId, requiredQuantity: String(b.requiredQuantity), allowedCategory: b.allowedCategory, discountPercentage: String(b.discountPercentage) }; modalOpen = true; }

	const getBundleName = (productId: string) => bundleProducts.find(p => p.id === productId)?.translations?.sv?.name || productId;

	async function handleSave() {
		if (!form.bundleProductId) { toast.error('Select a bundle product'); return; }
		const qty = parseInt(form.requiredQuantity), discount = parseFloat(form.discountPercentage);
		if (isNaN(qty) || qty < 1) { toast.error('Required quantity must be at least 1'); return; }
		if (isNaN(discount) || discount < 0 || discount > 100) { toast.error('Discount must be between 0 and 100'); return; }
		saving = true;
		try {
			const url = editingId ? `/api/bundles/${editingId}` : '/api/bundles';
			const method = editingId ? 'PATCH' : 'POST';
			const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bundleProductId: form.bundleProductId, requiredQuantity: qty, allowedCategory: form.allowedCategory, discountPercentage: discount }) });
			const data = await res.json();
			if (data.success) { toast.success(editingId ? 'Bundle updated' : 'Bundle created'); modalOpen = false; fetchAll(); }
			else toast.error(data.error || 'Failed to save bundle');
		} catch { toast.error('Failed to save bundle'); } finally { saving = false; }
	}

	async function handleDelete(id: string) {
		confirmDelete = null;
		try {
			const res = await fetch(`/api/bundles/${id}`, { method: 'DELETE' });
			const data = await res.json();
			if (data.success) { toast.success('Bundle deleted'); fetchAll(); }
			else toast.error(data.error || 'Failed to delete bundle');
		} catch { toast.error('Failed to delete bundle'); }
	}

	const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none";
</script>

<Toast />
<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Bundles</h1>
			<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Configure bundle discount rules</p>
		</div>
		<button on:click={openCreate} class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg">
			<Plus size={20} />Add Bundle
		</button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64"><div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
	{:else if error}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<p class="text-forest-600 dark:text-[#C5D4C5]">Failed to load bundles</p>
			<button on:click={fetchAll} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">Retry</button>
		</div>
	{:else}
		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
			{#if bundles.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
							<tr>
								{#each ['Bundle Product', 'Required Qty', 'Allowed Category', 'Discount', 'Created', 'Actions'] as th}
									<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">{th}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-cream-200 dark:divide-[#3f4946]">
							{#each bundles as bundle}
								<tr class="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
									<td class="px-6 py-4 font-medium text-forest-800 dark:text-[#E8EDE8]">{getBundleName(bundle.bundleProductId)}</td>
									<td class="px-6 py-4 text-forest-600 dark:text-[#C5D4C5]">{bundle.requiredQuantity}</td>
									<td class="px-6 py-4">
										<span class="px-2 py-1 rounded-full text-xs font-medium bg-sage-100 dark:bg-[#2a3330] text-sage-700 dark:text-sage-400 border border-sage-200 dark:border-[#3f4946]">
											{CATEGORIES.find(c => c.value === bundle.allowedCategory)?.label || bundle.allowedCategory}
										</span>
									</td>
									<td class="px-6 py-4 font-semibold text-forest-800 dark:text-[#E8EDE8]">{bundle.discountPercentage}%</td>
									<td class="px-6 py-4 text-sm text-forest-500 dark:text-[#8A9A8A]">{new Date(bundle.createdAt).toLocaleDateString('sv-SE')}</td>
									<td class="px-6 py-4">
										<div class="flex items-center gap-2">
											<button on:click={() => openEdit(bundle)} class="p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 dark:text-sage-400 transition-colors"><Pencil size={16} /></button>
											<button on:click={() => confirmDelete = bundle.id} class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"><Trash2 size={16} /></button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center text-forest-600 dark:text-[#C5D4C5]">
					<Layers size={48} class="mx-auto mb-4 text-forest-300 dark:text-[#6B7B6B]" />
					<p class="mb-4">No bundle configurations yet</p>
					<button on:click={openCreate} class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700">
						<Plus size={20} />Create First Bundle
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if modalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">{editingId ? 'Edit Bundle' : 'New Bundle Configuration'}</h2>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Bundle Product *</label>
					{#if bundleProducts.length > 0}
						<select bind:value={form.bundleProductId} class={inputClass}>
							<option value="">Select a bundle product...</option>
							{#each bundleProducts as p}<option value={p.id}>{p.translations?.sv?.name || p.name}</option>{/each}
						</select>
					{:else}
						<p class="text-sm text-forest-500 dark:text-[#8A9A8A] italic px-4 py-3 rounded-xl border-2 border-cream-200 dark:border-[#3f4946] bg-cream-50 dark:bg-[#1a1f1e]">
							No products with category "bundles" found. Create one first.
						</p>
					{/if}
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Required Qty *</label>
						<input type="number" min="1" bind:value={form.requiredQuantity} class={inputClass} />
					</div>
					<div>
						<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Discount % *</label>
						<input type="number" min="0" max="100" step="0.1" bind:value={form.discountPercentage} class={inputClass} />
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Allowed Category *</label>
					<select bind:value={form.allowedCategory} class={inputClass}>
						{#each CATEGORIES as c}<option value={c.value}>{c.label}</option>{/each}
					</select>
				</div>
			</div>
			<div class="flex gap-3 justify-end mt-6">
				<button on:click={() => modalOpen = false} class="px-5 py-2 rounded-full border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium hover:bg-cream-100 transition-all">Cancel</button>
				<button on:click={handleSave} disabled={saving} class="px-5 py-2 rounded-full bg-sage-600 text-white font-medium hover:bg-sage-700 transition-all disabled:opacity-50">
					{saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if confirmDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
			<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Delete bundle?</h3>
			<p class="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">Delete <span class="font-medium">{getBundleName(confirmDelete)}</span>? This cannot be undone.</p>
			<div class="flex gap-3">
				<button on:click={() => handleDelete(confirmDelete!)} class="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Delete</button>
				<button on:click={() => confirmDelete = null} class="flex-1 px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330]">Cancel</button>
			</div>
		</div>
	</div>
{/if}
