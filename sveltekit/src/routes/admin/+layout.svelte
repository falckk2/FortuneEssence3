<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { signOut } from '@auth/sveltekit/client';
	import { LayoutDashboard, ShoppingBag, Package, Users, BarChart2, RefreshCw, Settings, FlaskConical, Layers, LogOut, ChevronRight } from 'lucide-svelte';

	let { data, children } = $props();
	const session = $derived(data.session);

	onMount(() => {
		if (!session?.user) { goto('/auth/signin'); return; }
		if (!(session.user as any).isAdmin) { goto('/'); return; }
	});

	const navItems = [
		{ href: '/admin', icon: LayoutDashboard, label: 'Översikt' },
		{ href: '/admin/orders', icon: ShoppingBag, label: 'Beställningar' },
		{ href: '/admin/products', icon: Package, label: 'Produkter' },
		{ href: '/admin/customers', icon: Users, label: 'Kunder' },
		{ href: '/admin/inventory', icon: Layers, label: 'Lager' },
		{ href: '/admin/bundles', icon: Package, label: 'Bundles' },
		{ href: '/admin/returns', icon: RefreshCw, label: 'Returer' },
		{ href: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
		{ href: '/admin/settings', icon: Settings, label: 'Inställningar' },
		{ href: '/admin/test-config', icon: FlaskConical, label: 'Test Config' },
	];

	const currentPath = $derived($page.url.pathname);
</script>

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] flex">
	<!-- Sidebar -->
	<aside class="w-64 bg-white dark:bg-[#242a28] shadow-soft flex flex-col fixed h-full z-10">
		<div class="p-6 border-b border-cream-200 dark:border-[#3f4946]">
			<a href="/" class="text-xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Fortune Essence</a>
			<p class="text-xs text-forest-500 dark:text-[#6B7B6B] mt-1">Admin Panel</p>
		</div>

		<nav class="flex-1 p-4 space-y-1 overflow-y-auto">
			{#each navItems as item}
				<a href={item.href}
					class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors {currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href))
						? 'bg-sage-600 text-white'
						: 'text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-50 dark:hover:bg-[#2a3330]'}">
					<item.icon size={20} />
					<span class="font-medium">{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="p-4 border-t border-cream-200 dark:border-[#3f4946]">
			{#if session?.user}
				<div class="px-3 py-2 mb-2">
					<p class="text-sm font-medium text-forest-800 dark:text-[#E8EDE8] truncate">{session.user.name || session.user.email}</p>
					<p class="text-xs text-forest-500 dark:text-[#6B7B6B] truncate">{session.user.email}</p>
				</div>
			{/if}
			<button on:click={() => signOut({ callbackUrl: '/' })}
				class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
				<LogOut size={20} /><span class="font-medium">Logga ut</span>
			</button>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex-1 ml-64 p-8">
		{@render children()}
	</main>
</div>
