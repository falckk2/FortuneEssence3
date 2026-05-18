<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signOut } from '@auth/sveltekit/client';
	import { locale } from '$lib/stores/locale';
	import { User, ClipboardList, Settings, LogOut, ShieldCheck, ChevronRight } from 'lucide-svelte';

	let { data } = $props();
	const session = $derived(data.session);

	let stats: any = null;
	let loading = true;

	onMount(async () => {
		if (!session?.user) { goto('/auth/signin?callbackUrl=/account'); return; }
		try {
			const res = await fetch('/api/orders?action=statistics');
			if (res.ok) { const d = await res.json(); if (d.success) stats = d.data; }
		} finally { loading = false; }
	});

	const menuItems = [
		{ href: '/account/orders', icon: ClipboardList, labelSv: 'Mina beställningar', labelEn: 'My orders' },
		{ href: '/account/settings', icon: Settings, labelSv: 'Kontoinställningar', labelEn: 'Account settings' },
		{ href: '/account/privacy', icon: ShieldCheck, labelSv: 'Integritet & GDPR', labelEn: 'Privacy & GDPR' },
	];
</script>

<svelte:head><title>{$locale === 'sv' ? 'Mitt konto' : 'My account'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-12">
	<div class="container mx-auto px-4 max-w-4xl">
		{#if session?.user}
			<div class="mb-8">
				<div class="flex items-center gap-4 mb-2">
					<div class="w-16 h-16 bg-sage-100 dark:bg-sage-900 rounded-full flex items-center justify-center">
						<User size={32} class="text-sage-600 dark:text-sage-400" />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-forest-900 dark:text-[#E8EDE8]">{session.user.name ?? session.user.email}</h1>
						<p class="text-forest-600 dark:text-[#8A9A8A]">{session.user.email}</p>
					</div>
				</div>
			</div>

			{#if stats && !loading}
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
					{#each [['total', $locale === 'sv' ? 'Totalt' : 'Total'], ['pending', $locale === 'sv' ? 'Väntande' : 'Pending'], ['shipped', $locale === 'sv' ? 'Skickade' : 'Shipped'], ['delivered', $locale === 'sv' ? 'Levererade' : 'Delivered']] as [key, label]}
						<div class="bg-white dark:bg-[#2a3330] rounded-2xl p-4 shadow-soft text-center">
							<p class="text-3xl font-bold text-forest-800 dark:text-[#E8EDE8]">{stats[key] ?? 0}</p>
							<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mt-1">{label}</p>
						</div>
					{/each}
				</div>
			{/if}

			<div class="bg-white dark:bg-[#2a3330] rounded-2xl shadow-soft divide-y divide-cream-100 dark:divide-[#3f4946] mb-6">
				{#each menuItems as item}
					<a href={item.href} class="flex items-center justify-between px-6 py-4 hover:bg-cream-50 dark:hover:bg-[#343c39] transition-colors">
						<div class="flex items-center gap-3">
							<item.icon size={20} class="text-sage-600 dark:text-sage-400" />
							<span class="font-medium text-forest-800 dark:text-[#E8EDE8]">{$locale === 'sv' ? item.labelSv : item.labelEn}</span>
						</div>
						<ChevronRight size={20} class="text-forest-400 dark:text-[#6B7B6B]" />
					</a>
				{/each}
			</div>

			<button on:click={() => signOut({ callbackUrl: '/' })} class="w-full flex items-center justify-center gap-2 py-3 border-2 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
				<LogOut size={20} />{$locale === 'sv' ? 'Logga ut' : 'Sign out'}
			</button>
		{:else}
			<div class="text-center py-16">
				<p class="text-forest-600 dark:text-[#B8C5B8] mb-4">{$locale === 'sv' ? 'Du är inte inloggad' : 'You are not signed in'}</p>
				<a href="/auth/signin" class="px-6 py-3 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors">{$locale === 'sv' ? 'Logga in' : 'Sign in'}</a>
			</div>
		{/if}
	</div>
</div>
