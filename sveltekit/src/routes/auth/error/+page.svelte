<script lang="ts">
	import { page } from '$app/stores';

	const errorMessages: Record<string, string> = {
		Configuration: 'Det finns ett konfigurationsfel. Kontakta support.',
		AccessDenied: 'Åtkomst nekad. Du har inte behörighet att logga in.',
		Verification: 'Verifieringslänken har löpt ut eller redan använts.',
		Default: 'Ett inloggningsfel inträffade. Försök igen.',
	};

	$: errorCode = $page.url.searchParams.get('error') || 'Default';
	$: message = errorMessages[errorCode] || errorMessages.Default;
</script>

<svelte:head><title>Inloggningsfel – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] flex items-center justify-center px-4">
	<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-8 w-full max-w-md text-center border border-transparent dark:border-[#3f4946]">
		<div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
			<svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
			</svg>
		</div>
		<h1 class="text-2xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-2">Inloggningsfel</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mb-6">{message}</p>
		<div class="flex flex-col gap-3">
			<a href="/auth/signin"
				class="px-6 py-3 bg-sage-600 text-white font-medium rounded-full hover:bg-sage-700 transition-colors">
				Försök igen
			</a>
			<a href="/"
				class="px-6 py-3 border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] font-medium rounded-full hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors">
				Tillbaka till startsidan
			</a>
		</div>
	</div>
</div>
