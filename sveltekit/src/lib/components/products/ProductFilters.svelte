<script lang="ts">
	export let locale: 'sv' | 'en' = 'sv';
	export let filters: Record<string, unknown> = {};
	export let options: { categories: { category: string; count: number; displayName: { sv: string; en: string } }[]; priceRange: { min: number; max: number } } = { categories: [], priceRange: { min: 0, max: 1000 } };
	export let onFiltersChange: (f: Record<string, unknown>) => void = () => {};
	export let className = '';

	function setCategory(cat: string) {
		onFiltersChange({ ...filters, category: cat || undefined });
	}

	function clearFilters() {
		onFiltersChange({});
	}
</script>

<aside class="bg-white dark:bg-[#2a3330] rounded-2xl p-5 space-y-6 {className}">
	<div class="flex items-center justify-between">
		<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8]">{locale === 'sv' ? 'Filter' : 'Filters'}</h3>
		{#if Object.keys(filters).length > 0}
			<button on:click={clearFilters} class="text-sm text-sage-600 hover:text-sage-700">
				{locale === 'sv' ? 'Rensa' : 'Clear'}
			</button>
		{/if}
	</div>

	<!-- Categories -->
	<div>
		<h4 class="text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-3">{locale === 'sv' ? 'Kategori' : 'Category'}</h4>
		<div class="space-y-2">
			<button
				on:click={() => setCategory('')}
				class="block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors {!filters.category ? 'bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 font-medium' : 'text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-100 dark:hover:bg-[#343c39]'}"
			>
				{locale === 'sv' ? 'Alla kategorier' : 'All categories'}
			</button>
			{#each options.categories as cat}
				<button
					on:click={() => setCategory(cat.category)}
					class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors {filters.category === cat.category ? 'bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 font-medium' : 'text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-100 dark:hover:bg-[#343c39]'}"
				>
					<span>{cat.displayName[locale]}</span>
					<span class="text-forest-500 dark:text-[#8A9A8A] text-xs">({cat.count})</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- In Stock -->
	<div>
		<label class="flex items-center gap-3 cursor-pointer">
			<input
				type="checkbox"
				checked={!!filters.inStock}
				on:change={e => onFiltersChange({ ...filters, inStock: (e.target as HTMLInputElement).checked || undefined })}
				class="h-4 w-4 text-sage-600 rounded border-cream-300 dark:border-[#4a5552]"
			/>
			<span class="text-sm text-forest-700 dark:text-[#C5D4C5]">{locale === 'sv' ? 'Bara i lager' : 'In stock only'}</span>
		</label>
	</div>
</aside>
