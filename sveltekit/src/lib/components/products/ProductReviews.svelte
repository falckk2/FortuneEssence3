<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast';

	export let productId: string;
	export let userId: string | undefined = undefined;

	let reviews: any[] = [];
	let loading = true;
	let showForm = false;
	let submitting = false;
	let formData = { rating: 5, title: '', comment: '' };

	onMount(async () => {
		try {
			const res = await fetch(`/api/reviews?productId=${productId}`);
			const data = await res.json();
			if (data.success) reviews = data.data;
		} finally {
			loading = false;
		}
	});

	async function submitReview() {
		submitting = true;
		try {
			const res = await fetch('/api/reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productId, ...formData }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success('Recension skickad!');
				showForm = false;
				formData = { rating: 5, title: '', comment: '' };
			} else {
				toast.error(data.error || 'Något gick fel');
			}
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mt-8">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Recensioner</h2>
		{#if userId && !showForm}
			<button on:click={() => showForm = true} class="px-4 py-2 bg-sage-600 text-white rounded-full text-sm hover:bg-sage-700 transition-colors">
				Skriv recension
			</button>
		{/if}
	</div>

	{#if showForm}
		<form on:submit|preventDefault={submitReview} class="bg-cream-50 dark:bg-[#2a3330] rounded-2xl p-6 mb-6 space-y-4">
			<div>
				<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">Betyg</label>
				<select bind:value={formData.rating} class="border border-cream-300 dark:border-[#4a5552] rounded-lg px-3 py-2 bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]">
					{#each [5, 4, 3, 2, 1] as r}
						<option value={r}>{r} ★</option>
					{/each}
				</select>
			</div>
			<input bind:value={formData.title} placeholder="Rubrik" required class="w-full border border-cream-300 dark:border-[#4a5552] rounded-lg px-3 py-2 bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" />
			<textarea bind:value={formData.comment} placeholder="Din recension..." rows={4} required class="w-full border border-cream-300 dark:border-[#4a5552] rounded-lg px-3 py-2 bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]"></textarea>
			<div class="flex gap-3">
				<button type="submit" disabled={submitting} class="px-6 py-2 bg-sage-600 text-white rounded-full hover:bg-sage-700 disabled:opacity-50">Skicka</button>
				<button type="button" on:click={() => showForm = false} class="px-6 py-2 border border-cream-300 dark:border-[#4a5552] rounded-full text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-100 dark:hover:bg-[#343c39]">Avbryt</button>
			</div>
		</form>
	{/if}

	{#if loading}
		<div class="animate-pulse space-y-4">
			{#each [1, 2, 3] as _}
				<div class="h-24 bg-cream-200 dark:bg-[#343c39] rounded-2xl"></div>
			{/each}
		</div>
	{:else if reviews.length === 0}
		<p class="text-forest-600 dark:text-[#8A9A8A] text-center py-8">Inga recensioner ännu. Bli den första!</p>
	{:else}
		<div class="space-y-4">
			{#each reviews as review (review.id)}
				<div class="bg-white dark:bg-[#2a3330] rounded-2xl p-5 shadow-soft">
					<div class="flex items-start justify-between mb-2">
						<div>
							<span class="font-medium text-forest-800 dark:text-[#E8EDE8]">{review.userName}</span>
							{#if review.verified}
								<span class="ml-2 text-xs bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 px-2 py-0.5 rounded-full">✓ Verifierad köp</span>
							{/if}
						</div>
						<div class="text-terracotta-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
					</div>
					<p class="font-medium text-forest-800 dark:text-[#E8EDE8] mb-1">{review.title}</p>
					<p class="text-forest-600 dark:text-[#B8C5B8] text-sm">{review.comment}</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
