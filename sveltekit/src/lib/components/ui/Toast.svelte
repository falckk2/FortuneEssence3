<script lang="ts">
	import { toast } from '$lib/stores/toast';
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
	{#each $toast as t (t.id)}
		<div
			class="pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm animate-in {t.type === 'success'
				? 'bg-sage-600 text-white'
				: t.type === 'error'
					? 'bg-red-600 text-white'
					: 'bg-forest-700 text-white'}"
		>
			{t.message}
			<button class="ml-3 opacity-70 hover:opacity-100" on:click={() => toast.remove(t.id)}>✕</button>
		</div>
	{/each}
</div>
