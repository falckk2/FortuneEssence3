<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { theme } from '$lib/stores/theme';
</script>

<button
	on:click={() => theme.toggle()}
	class="p-2 text-forest-600 hover:text-forest-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors"
	aria-label="Toggle theme"
>
	{#if $theme === 'dark'}
		<Sun class="h-6 w-6" />
	{:else}
		<Moon class="h-6 w-6" />
	{/if}
</button>
