<script lang="ts">
	import { locale } from '$lib/stores/locale';
	import CheckoutForm from '$lib/components/checkout/CheckoutForm.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ArrowLeft, ShieldCheck } from 'lucide-svelte';
</script>

<svelte:head><title>{$locale === 'sv' ? 'Kassa' : 'Checkout'} – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-gradient-to-b from-cream-50 to-white dark:from-[#1a1f1e] dark:to-[#242a28] py-12">
	<div class="container mx-auto px-4">
		<div class="mb-8">
			<a href="/products" class="inline-flex items-center text-sage-600 hover:text-sage-700 dark:text-sage-400 mb-4">
				<ArrowLeft size={16} class="mr-2" />{$locale === 'sv' ? 'Fortsätt handla' : 'Continue shopping'}
			</a>
			<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8]">{$locale === 'sv' ? 'Kassa' : 'Checkout'}</h1>
		</div>

		<!-- Progress steps -->
		<div class="mb-8 flex items-center justify-center space-x-4 sm:space-x-8">
			{#each [$locale === 'sv' ? 'Information' : 'Information', $locale === 'sv' ? 'Betalning' : 'Payment', $locale === 'sv' ? 'Bekräftelse' : 'Confirmation'] as step, i}
				<div class="flex items-center">
					<div class="w-8 h-8 {i === 0 ? 'bg-sage-600 text-white' : 'bg-cream-300 dark:bg-[#4a5552] text-forest-600 dark:text-[#8A9A8A]'} rounded-full flex items-center justify-center text-sm font-medium">{i + 1}</div>
					<span class="ml-2 text-xs sm:text-sm font-medium {i === 0 ? 'text-forest-900 dark:text-[#E8EDE8]' : 'text-forest-500 dark:text-[#8A9A8A]'}">{step}</span>
				</div>
				{#if i < 2}<div class="w-10 sm:w-16 h-0.5 bg-cream-300 dark:bg-[#4a5552]"></div>{/if}
			{/each}
		</div>

		<CheckoutForm locale={$locale} />

		<div class="mt-12 text-center">
			<div class="inline-flex items-center space-x-2 text-sm text-forest-600 dark:text-[#B8C5B8]">
				<ShieldCheck size={16} class="text-green-500" />
				<span>{$locale === 'sv' ? 'Säker och krypterad betalning' : 'Secure and encrypted payment'}</span>
			</div>
		</div>
	</div>
</div>
