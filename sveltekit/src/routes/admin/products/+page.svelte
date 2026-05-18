<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Plus, Search, Pencil, Trash2, Eye, EyeOff, Image } from 'lucide-svelte';

	let products: any[] = [];
	let loading = true;
	let error = false;
	let searchQuery = '';
	let categoryFilter = 'all';
	let stockFilter = 'all';
	let deleteConfirm: { id: string; name: string } | null = null;

	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);
	const categoryNames: Record<string, string> = {
		'essential-oils': 'Essential Oils', 'carrier-oils': 'Carrier Oils',
		'diffusers': 'Diffusers', 'accessories': 'Accessories', 'gift-sets': 'Gift Sets', 'bundles': 'Bundles',
	};
	const categoryColors: Record<string, string> = {
		'essential-oils': 'bg-sage-100 text-sage-700 border-sage-200 dark:bg-[#2a3330] dark:text-sage-400 dark:border-[#3f4946]',
		'gift-sets': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
	};

	function getStockStatus(stock: number) {
		if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' };
		if (stock <= 5) return { label: `Low Stock (${stock})`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700' };
		return { label: `In Stock (${stock})`, color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' };
	}

	async function fetchProducts() {
		loading = true; error = false;
		try {
			const res = await fetch('/api/products');
			const data = await res.json();
			if (data.success) products = data.data;
			else { error = true; toast.error('Failed to load products'); }
		} catch { error = true; toast.error('Failed to load products'); } finally { loading = false; }
	}

	onMount(fetchProducts);

	$: filteredProducts = products.filter(p => {
		const matchSearch = !searchQuery ||
			p.translations?.sv?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.translations?.en?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
		const matchStock = stockFilter === 'all' ||
			(stockFilter === 'in-stock' && p.stock > 5) ||
			(stockFilter === 'low-stock' && p.stock > 0 && p.stock <= 5) ||
			(stockFilter === 'out-of-stock' && p.stock === 0);
		return matchSearch && matchCat && matchStock;
	});

	async function handleToggleActive(productId: string, current: boolean) {
		try {
			const res = await fetch(`/api/products/${productId}`, {
				method: 'PATCH', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !current }),
			});
			if (res.ok) {
				products = products.map(p => p.id === productId ? { ...p, isActive: !current } : p);
				toast.success(!current ? 'Product activated' : 'Product deactivated');
			} else { toast.error('Failed to update product'); }
		} catch { toast.error('Failed to update product'); }
	}

	async function handleDelete(productId: string) {
		deleteConfirm = null;
		try {
			const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
			if (res.ok) { products = products.filter(p => p.id !== productId); toast.success('Product deleted successfully'); }
			else { toast.error('Failed to delete product'); }
		} catch { toast.error('Failed to delete product'); }
	}
</script>

<Toast />
<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Products</h1>
			<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Manage your product catalog</p>
		</div>
		<a href="/admin/products/new" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700 transition-all shadow-lg">
			<Plus size={20} />Add Product
		</a>
	</div>

	{#if loading}
		<div class="flex items-center justify-center h-64"><div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
	{:else if error}
		<div class="flex flex-col items-center justify-center h-64 gap-4">
			<p class="text-red-600 dark:text-red-400">Failed to load products</p>
			<button on:click={fetchProducts} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">Retry</button>
		</div>
	{:else}
		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div class="md:col-span-2 relative">
					<Search size={20} class="absolute left-4 top-1/2 -translate-y-1/2 text-forest-400 dark:text-[#6B7B6B]" />
					<input type="text" placeholder="Search products..." bind:value={searchQuery}
						class="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none" />
				</div>
				<select bind:value={categoryFilter} class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none">
					<option value="all">All Categories</option>
					{#each Object.entries(categoryNames) as [val, label]}<option value={val}>{label}</option>{/each}
				</select>
				<select bind:value={stockFilter} class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none">
					<option value="all">All Stock Levels</option>
					<option value="in-stock">In Stock</option>
					<option value="low-stock">Low Stock</option>
					<option value="out-of-stock">Out of Stock</option>
				</select>
			</div>
			<p class="mt-4 text-sm text-forest-600 dark:text-[#8A9A8A]">Showing {filteredProducts.length} of {products.length} products</p>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden">
			{#if filteredProducts.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead class="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
							<tr>
								{#each ['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'] as th}
									<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase tracking-wider">{th}</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-cream-200 dark:divide-[#3f4946]">
							{#each filteredProducts as product}
								{@const stockStatus = getStockStatus(product.stock)}
								<tr class="hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">
									<td class="px-6 py-4">
										<div class="flex items-center gap-4">
											<div class="w-16 h-16 rounded-xl overflow-hidden bg-cream-100 dark:bg-[#2a3330] flex-shrink-0 flex items-center justify-center">
												{#if product.images?.[0]}
													<img src={product.images[0]} alt={product.translations?.sv?.name} class="w-full h-full object-cover" />
												{:else}
													<Image size={32} class="text-forest-300 dark:text-[#6B7B6B]" />
												{/if}
											</div>
											<div>
												<a href="/products/{product.id}" class="font-medium text-forest-800 dark:text-[#E8EDE8] hover:text-sage-700 transition-colors">
													{product.translations?.sv?.name || product.name}
												</a>
												<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">SKU: {product.sku}</p>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium border {categoryColors[product.category] || 'bg-cream-200 text-forest-700 border-cream-300 dark:bg-[#2a3330] dark:text-[#C5D4C5] dark:border-[#3f4946]'}">
											{categoryNames[product.category] || product.category}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap font-medium text-forest-800 dark:text-[#E8EDE8]">{formatPrice(product.price)}</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<span class="inline-flex px-3 py-1 rounded-full text-xs font-medium border {stockStatus.color}">{stockStatus.label}</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<button on:click={() => handleToggleActive(product.id, product.isActive)}
											class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition-colors {product.isActive ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700' : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-[#343c39] dark:text-[#8A9A8A] dark:border-[#4a5552]'}">
											{#if product.isActive}<Eye size={12} />Active{:else}<EyeOff size={12} />Inactive{/if}
										</button>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center gap-2">
											<a href="/admin/products/{product.id}" class="p-2 rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] text-sage-700 dark:text-sage-400 transition-colors"><Pencil size={20} /></a>
											<button on:click={() => deleteConfirm = { id: product.id, name: product.translations?.sv?.name || product.name }}
												class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"><Trash2 size={20} /></button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="p-12 text-center text-forest-600 dark:text-[#C5D4C5]">
					<Image size={48} class="mx-auto mb-4 text-forest-400 dark:text-[#6B7B6B]" />
					<p class="mb-4">No products found</p>
					<a href="/admin/products/new" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sage-600 text-white font-semibold hover:bg-sage-700">
						<Plus size={20} />Add Your First Product
					</a>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if deleteConfirm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
		<div class="bg-white dark:bg-[#242a28] rounded-xl p-6 max-w-sm mx-4 shadow-xl">
			<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">Delete product?</h3>
			<p class="text-forest-600 dark:text-[#C5D4C5] text-sm mb-6">
				Are you sure you want to delete <span class="font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
			</p>
			<div class="flex gap-3">
				<button on:click={() => handleDelete(deleteConfirm!.id)} class="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">Delete</button>
				<button on:click={() => deleteConfirm = null} class="flex-1 px-4 py-2 border border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-lg hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors">Cancel</button>
			</div>
		</div>
	</div>
{/if}
