<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ArrowLeft, Trash2 } from 'lucide-svelte';

	const CATEGORIES = [
		{ value: 'essential-oils', label: 'Essential Oils' }, { value: 'carrier-oils', label: 'Carrier Oils' },
		{ value: 'diffusers', label: 'Diffusers' }, { value: 'accessories', label: 'Accessories' },
		{ value: 'gift-sets', label: 'Gift Sets' }, { value: 'bundles', label: 'Bundles' },
	];

	$: id = $page.params.id;
	let loading = true;
	let saving = false;
	let deleting = false;
	let deleteConfirm = false;
	let form = { nameSv: '', descriptionSv: '', nameEn: '', descriptionEn: '', price: '', sku: '', category: 'essential-oils', weight: '', length: '', width: '', height: '', stock: '0', images: '', isActive: true };

	onMount(async () => {
		try {
			const res = await fetch(`/api/products/${id}`);
			const data = await res.json();
			if (data.success && data.data) {
				const p = data.data;
				form = {
					nameSv: p.translations?.sv?.name || '', descriptionSv: p.translations?.sv?.description || '',
					nameEn: p.translations?.en?.name || '', descriptionEn: p.translations?.en?.description || '',
					price: String(p.price), sku: p.sku, category: p.category,
					weight: String(p.weight || ''), length: String(p.dimensions?.length || ''),
					width: String(p.dimensions?.width || ''), height: String(p.dimensions?.height || ''),
					stock: String(p.stock), images: (p.images || []).join('\n'), isActive: p.isActive,
				};
			} else { toast.error('Product not found'); goto('/admin/products'); }
		} catch { toast.error('Failed to load product'); goto('/admin/products'); } finally { loading = false; }
	});

	async function handleSave(e: Event) {
		e.preventDefault();
		saving = true;
		try {
			const body = {
				translations: { sv: { name: form.nameSv, description: form.descriptionSv }, en: { name: form.nameEn, description: form.descriptionEn } },
				price: parseFloat(form.price), sku: form.sku, category: form.category,
				weight: parseFloat(form.weight) || 0,
				dimensions: { length: parseFloat(form.length) || 0, width: parseFloat(form.width) || 0, height: parseFloat(form.height) || 0 },
				stock: parseInt(form.stock) || 0,
				images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
				isActive: form.isActive,
			};
			const res = await fetch(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
			const data = await res.json();
			if (data.success) toast.success('Product updated');
			else toast.error(data.error || 'Failed to update');
		} catch { toast.error('Failed to update product'); } finally { saving = false; }
	}

	async function handleDelete() {
		deleteConfirm = false; deleting = true;
		try {
			const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
			if (res.ok) { toast.success('Product deleted'); goto('/admin/products'); }
			else toast.error('Failed to delete product');
		} catch { toast.error('Failed to delete product'); } finally { deleting = false; }
	}

	const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors";
	const labelClass = "block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1";
</script>

<Toast />
{#if loading}
	<div class="flex items-center justify-center h-64"><div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
{:else}
	<div class="space-y-6 max-w-3xl">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-4">
				<a href="/admin/products" class="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors">
					<ArrowLeft size={20} class="text-forest-700 dark:text-[#C5D4C5]" />
				</a>
				<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Edit Product</h1>
			</div>
			<button on:click={() => deleteConfirm = true} disabled={deleting}
				class="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
				<Trash2 size={16} />Delete
			</button>
		</div>

		<form on:submit={handleSave} class="space-y-6">
			<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946] space-y-4">
				<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Swedish</h2>
				<div><label class={labelClass}>Name *</label><input type="text" bind:value={form.nameSv} required class={inputClass} /></div>
				<div><label class={labelClass}>Description</label><textarea bind:value={form.descriptionSv} rows={3} class={inputClass}></textarea></div>
			</div>

			<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946] space-y-4">
				<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">English</h2>
				<div><label class={labelClass}>Name *</label><input type="text" bind:value={form.nameEn} required class={inputClass} /></div>
				<div><label class={labelClass}>Description</label><textarea bind:value={form.descriptionEn} rows={3} class={inputClass}></textarea></div>
			</div>

			<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946] space-y-4">
				<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Details</h2>
				<div class="grid grid-cols-2 gap-4">
					<div><label class={labelClass}>Price (SEK) *</label><input type="number" bind:value={form.price} required min="0" step="0.01" class={inputClass} /></div>
					<div><label class={labelClass}>SKU *</label><input type="text" bind:value={form.sku} required class={inputClass} /></div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div><label class={labelClass}>Category *</label>
						<select bind:value={form.category} class={inputClass}>{#each CATEGORIES as c}<option value={c.value}>{c.label}</option>{/each}</select>
					</div>
					<div><label class={labelClass}>Stock</label><input type="number" bind:value={form.stock} min="0" class={inputClass} /></div>
				</div>
				<div><label class={labelClass}>Weight (g)</label><input type="number" bind:value={form.weight} min="0" class={inputClass} /></div>
				<div class="grid grid-cols-3 gap-4">
					<div><label class={labelClass}>Length (cm)</label><input type="number" bind:value={form.length} min="0" class={inputClass} /></div>
					<div><label class={labelClass}>Width (cm)</label><input type="number" bind:value={form.width} min="0" class={inputClass} /></div>
					<div><label class={labelClass}>Height (cm)</label><input type="number" bind:value={form.height} min="0" class={inputClass} /></div>
				</div>
				<div><label class={labelClass}>Image URLs (one per line)</label><textarea bind:value={form.images} rows={3} placeholder="https://..." class={inputClass}></textarea></div>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={form.isActive} class="w-4 h-4 rounded text-sage-600" />
					<span class="text-sm font-medium text-forest-700 dark:text-[#C5D4C5]">Active (visible to customers)</span>
				</label>
			</div>

			<div class="flex gap-4">
				<button type="submit" disabled={saving} class="flex-1 py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium disabled:opacity-50 transition-colors">
					{saving ? 'Saving...' : 'Save Changes'}
				</button>
				<a href="/admin/products" class="px-6 py-3 border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] rounded-full hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">Cancel</a>
			</div>
		</form>
	</div>

	{#if deleteConfirm}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
				<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Delete product?</h3>
				<p class="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">Are you sure you want to delete <span class="font-medium">{form.nameSv}</span>? This cannot be undone.</p>
				<div class="flex gap-3">
					<button on:click={handleDelete} class="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Delete</button>
					<button on:click={() => deleteConfirm = false} class="flex-1 px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330]">Cancel</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
