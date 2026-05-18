<script lang="ts">
	export let quantity: number = 2;
</script>

<div class="flex items-end justify-center gap-2">
	{#each Array(quantity) as _, i}
		<div class="flex flex-col items-center" style="margin-bottom: {i % 2 === 0 ? '0' : '1rem'}">
			<div class="w-16 h-24 bg-gradient-to-b from-sage-200 to-sage-400 dark:from-sage-700 dark:to-sage-900 rounded-lg shadow-md flex items-end justify-center pb-2">
				<div class="w-10 h-2 bg-sage-600 dark:bg-sage-400 rounded-full"></div>
			</div>
		</div>
	{/each}
</div>
