<script lang="ts">
	import { locale } from '$lib/stores/locale';
</script>

<svelte:head><title>Om oss – Fortune Essence</title></svelte:head>

<div class="min-h-screen">
	<section class="relative overflow-hidden bg-gradient-to-br from-yellow-100 via-purple-50 to-yellow-50 dark:from-[#2a3330] dark:via-[#1a1f1e] dark:to-[#242a28] py-32">
		<div class="container mx-auto px-4 relative">
			<div class="text-center max-w-4xl mx-auto">
				<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-forest-900 dark:text-[#E8EDE8] mb-6">
					<span class="block bg-gradient-to-r from-yellow-600 via-purple-600 to-yellow-600 dark:from-sage-400 dark:via-sage-300 dark:to-sage-400 bg-clip-text text-transparent">
						Fortune Essence
					</span>
				</h1>
				<p class="text-xl text-forest-700 dark:text-[#B8C5B8] mb-8 leading-relaxed">
					{$locale === 'sv'
						? 'Upptäck vårt sortiment av exklusiva paket och buntar.'
						: 'Discover our selection of exclusive packages and bundles.'}
				</p>
				<a href="/" class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-gradient-to-r from-sage-600 to-sage-800 dark:from-sage-700 dark:to-sage-800 hover:from-sage-700 hover:to-sage-900 transition-colors duration-200">
					{$locale === 'sv' ? 'Se Produkter' : 'Shop Now'}
					<svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" /></svg>
				</a>
			</div>
		</div>
	</section>
</div>
