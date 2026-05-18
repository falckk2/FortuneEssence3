<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import OilAdvisorWidget from '$lib/components/advisor/OilAdvisorWidget.svelte';
	import CookieConsent from '$lib/components/gdpr/CookieConsent.svelte';
	import DevAdminButton from '$lib/components/admin/DevAdminButton.svelte';
	import { theme } from '$lib/stores/theme';
	import { locale } from '$lib/stores/locale';
	import { cart } from '$lib/stores/cart';
	import { wishlist } from '$lib/stores/wishlist';

	let { data, children } = $props();

	const session = $derived(data.session);

	onMount(() => {
		theme.init();
		locale.init();
		cart.refresh();
		if (data.session) {
			wishlist.setAuthenticated(true);
		}
	});
</script>

<svelte:head>
	<title>Fortune Essence - Premium Essential Oils</title>
	<meta name="description" content="Discover premium essential oils and aromatherapy products." />
</svelte:head>

<div class="min-h-screen flex flex-col bg-white dark:bg-[#1a1f1e] text-forest-900 dark:text-[#E8EDE8]">
	<Header {session} />
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
	<OilAdvisorWidget />
	<CookieConsent />
	<DevAdminButton />
</div>
