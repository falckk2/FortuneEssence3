<script lang="ts">
	import { browser } from '$app/environment';
	import { locale } from '$lib/stores/locale';

	let visible = false;
	$: isSv = $locale === 'sv';

	import { onMount } from 'svelte';
	onMount(() => {
		visible = !localStorage.getItem('cookie-consent');
	});

	function accept() {
		localStorage.setItem('cookie-consent', 'accepted');
		visible = false;
	}

	function decline() {
		localStorage.setItem('cookie-consent', 'declined');
		visible = false;
	}
</script>

{#if visible}
	<div class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#242a28] border-t border-sage-200 dark:border-[#3f4946] shadow-lg p-4">
		<div class="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
			<p class="text-sm text-forest-700 dark:text-[#B8C5B8]">
				{isSv
					? 'Vi använder cookies för att förbättra din upplevelse. Genom att fortsätta godkänner du vår cookiepolicy.'
					: 'We use cookies to enhance your experience. By continuing you agree to our cookie policy.'}
				<a href="/privacy" class="underline hover:text-sage-700 ml-1">{isSv ? 'Läs mer' : 'Learn more'}</a>
			</p>
			<div class="flex gap-3 flex-shrink-0">
				<button
					on:click={decline}
					class="px-4 py-2 text-sm border border-sage-300 dark:border-[#3f4946] rounded-lg text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#2a3330] transition-colors"
				>
					{isSv ? 'Avvisa' : 'Decline'}
				</button>
				<button
					on:click={accept}
					class="px-4 py-2 text-sm bg-sage-600 hover:bg-sage-700 text-white rounded-lg transition-colors"
				>
					{isSv ? 'Acceptera' : 'Accept'}
				</button>
			</div>
		</div>
	</div>
{/if}
