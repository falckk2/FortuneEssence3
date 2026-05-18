<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	const CATEGORIES = [
		{ value: 'essential-oils', label: 'Essential Oils' }, { value: 'carrier-oils', label: 'Carrier Oils' },
		{ value: 'diffusers', label: 'Diffusers' }, { value: 'accessories', label: 'Accessories' },
		{ value: 'gift-sets', label: 'Gift Sets' }, { value: 'bundles', label: 'Bundles' },
	];

	let saving = false;
	let form = { nameSv: '', descriptionSv: '', nameEn: '', descriptionEn: '', price: '', sku: '', category: 'essential-oils', weight: '', length: '', width: '', height: '', stock: '0', images: '', isActive: true };

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
			const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
			const data = await res.json();
			if (data.success) { toast.success('Product created'); goto('/admin/products'); }
			else { toast.error(data.error || 'Failed to create product'); }
		} catch { toast.error('Failed to create product'); } finally { saving = false; }
	}

	const inputClass = "w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors";
	const labelClass = "block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1";
</script>

<Toast />
<div class="space-y-6 max-w-3xl">
	<div class="flex items-center gap-4">
		<a href="/admin/products" class="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors">
			<ArrowLeft size={20} class="text-forest-700 dark:text-[#C5D4C5]" />
		</a>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">New Product</h1>
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
				<div>
					<label class={labelClass}>Category *</label>
					<select bind:value={form.category} class={inputClass}>
						{#each CATEGORIES as c}<option value={c.value}>{c.label}</option>{/each}
					</select>
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
				{saving ? 'Creating...' : 'Create Product'}
			</button>
			<a href="/admin/products" class="px-6 py-3 border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] rounded-full hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">Cancel</a>
		</div>
	</form>
</div>
