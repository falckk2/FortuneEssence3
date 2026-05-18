<script lang="ts">
	import { CheckCircle, Clock } from 'lucide-svelte';

	interface ShippingRate {
		id: string;
		name: string;
		description?: string;
		price: number;
		estimatedDays: number;
		logoUrl?: string;
		features?: string[];
		isEcoFriendly?: boolean;
	}

	let { rate, selected, onClick, locale = 'sv' }: {
		rate: ShippingRate;
		selected: boolean;
		onClick: () => void;
		locale?: 'sv' | 'en';
	} = $props();

	const isFree = rate.price === 0;
</script>

<button type="button" on:click={onClick}
	class="w-full p-4 rounded-lg border-2 transition-all text-left {selected
		? 'border-sage-600 bg-sage-50 dark:bg-[#2a3330] shadow-md'
		: 'border-cream-200 dark:border-[#3f4946] hover:border-sage-300 bg-white dark:bg-[#242a28] hover:bg-sage-50/30 dark:hover:bg-[#2a3330]'}">
	<div class="flex items-start gap-4">
		<div class="flex-shrink-0 mt-1">
			{#if selected}
				<CheckCircle size={24} class="text-sage-600" />
			{:else}
				<div class="w-6 h-6 rounded-full border-2 border-cream-300 dark:border-[#4a5552]"></div>
			{/if}
		</div>

		{#if rate.logoUrl}
			<div class="flex-shrink-0 w-16 h-16">
				<img src={rate.logoUrl} alt={rate.name} class="w-full h-full object-contain" />
			</div>
		{/if}

		<div class="flex-1 min-w-0">
			<div class="flex items-start justify-between gap-2 mb-1">
				<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] text-base">{rate.name}</h3>
				<div class="flex-shrink-0">
					{#if isFree}
						<span class="text-lg font-bold text-green-600">{locale === 'sv' ? 'Gratis' : 'Free'}</span>
					{:else}
						<span class="text-lg font-bold text-forest-800 dark:text-[#E8EDE8]">{rate.price.toFixed(0)} kr</span>
					{/if}
				</div>
			</div>

			{#if rate.description}
				<p class="text-sm text-forest-600 dark:text-[#B8C5B8] mb-2 line-clamp-2">{rate.description}</p>
			{/if}

			<div class="flex items-center gap-2 text-sm text-forest-700 dark:text-[#C5D4C5] mb-2">
				<Clock size={16} class="flex-shrink-0" />
				<span>
					{rate.estimatedDays === 0 ? (locale === 'sv' ? 'Samma dag' : 'Same day')
						: rate.estimatedDays === 1 ? (locale === 'sv' ? 'Nästa arbetsdag' : 'Next business day')
						: `${rate.estimatedDays} ${locale === 'sv' ? 'dagar' : 'days'}`}
				</span>
			</div>

			{#if rate.features && rate.features.length > 0}
				<div class="flex flex-wrap gap-1.5">
					{#each rate.features.slice(0, 4) as feature}
						<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium {rate.isEcoFriendly && feature.toLowerCase().includes('miljö') ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-cream-100 dark:bg-[#2a3330] text-forest-700 dark:text-[#C5D4C5]'}">
							{feature}
						</span>
					{/each}
				</div>
			{/if}

			{#if rate.isEcoFriendly}
				<div class="mt-2 flex items-center gap-1 text-green-700">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
					</svg>
					<span class="text-xs font-medium">{locale === 'sv' ? 'Miljövänligt alternativ' : 'Eco-friendly option'}</span>
				</div>
			{/if}
		</div>
	</div>
</button>
