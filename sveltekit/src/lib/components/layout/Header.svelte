<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Search, User, Menu, X, Heart, Languages } from 'lucide-svelte';
	import CartIcon from '$lib/components/cart/CartIcon.svelte';
	import ThemeToggle from '$lib/components/theme/ThemeToggle.svelte';
	import { locale } from '$lib/stores/locale';
	import { wishlist, wishlistCount } from '$lib/stores/wishlist';
	import { cart } from '$lib/stores/cart';
	export let session: import('@auth/sveltekit').Session | null = null;

	let isMobileMenuOpen = false;
	let searchQuery = '';

	$: user = session?.user as { firstName?: string; lastName?: string; isAdmin?: boolean } & typeof session.user | null;
	$: isAuthenticated = !!session;
	$: isSv = $locale === 'sv';

	const navItems = [
		{ sv: 'Hem', en: 'Home', href: '/' },
		{ sv: 'Produkter', en: 'Products', href: '/products' },
		{ sv: 'Instruktioner', en: 'Essential Oil Guide', href: '/how-to-use' },
		{ sv: 'Kontakt', en: 'Contact', href: '/contact' },
	];

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
			searchQuery = '';
		}
	}
</script>

<header class="bg-white dark:bg-[#242a28] shadow-sm border-b border-cream-200 dark:border-[#3f4946]">
	<!-- Top bar -->
	<div class="bg-gradient-to-r from-sage-100 to-cream-100 dark:from-[#2a3330] dark:to-[#1f2624] border-b border-sage-200 dark:border-[#3f4946]">
		<div class="container mx-auto px-4 py-2">
			<div class="flex items-center justify-between text-sm">
				<p class="text-forest-700 dark:text-[#B8C5B8] truncate mr-4">
					<span class="hidden sm:inline">
						{isSv ? 'Fri frakt över 500 kr | Snabb leverans i hela Sverige' : 'Free shipping over 500 SEK | Fast delivery across Sweden'}
					</span>
					<span class="sm:hidden">
						{isSv ? 'Fri frakt över 500 kr' : 'Free shipping over 500 SEK'}
					</span>
				</p>
				<div class="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
					<a href="/faq" class="text-forest-600 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors font-medium">
						{isSv ? 'Hjälp' : 'Help'}
					</a>
					<button
						on:click={() => locale.toggle()}
						class="flex items-center space-x-1 text-forest-600 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] transition-colors font-medium"
					>
						<Languages class="h-4 w-4" />
						<span class="uppercase font-bold">{isSv ? 'SV' : 'EN'}</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Main header -->
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-between h-20">
			<!-- Logo -->
			<div class="flex-shrink-0">
				<a href="/" class="flex items-center space-x-3 group">
					<div class="relative">
						<div class="w-12 h-12 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 overflow-hidden bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-800/30">
							<img src="/images/logo.jpg" alt="Fortune Essence Logo" width="48" height="48" class="object-cover" />
						</div>
					</div>
					<div class="flex flex-col">
						<span class="text-2xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] tracking-tight leading-none group-hover:text-sage-700 dark:group-hover:text-sage-400 transition-colors">
							Fortune Essence
						</span>
						<span class="text-xs text-sage-600 dark:text-[#8A9A8A] font-light tracking-widest uppercase">
							Premium Essential Oils
						</span>
					</div>
				</a>
			</div>

			<!-- Desktop Navigation -->
			<nav class="hidden lg:flex items-center space-x-8">
				{#each navItems as item}
					<a
						href={item.href}
						class="text-forest-700 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] px-3 py-2 text-sm font-medium transition-colors"
					>
						{isSv ? item.sv : item.en}
					</a>
				{/each}
			</nav>

			<!-- Search Bar -->
			<div class="hidden md:flex flex-1 max-w-md mx-8">
				<form on:submit={handleSearch} class="w-full relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={isSv ? 'Sök produkter...' : 'Search products...'}
						class="w-full pl-10 pr-4 py-2 border border-sage-300 dark:border-[#3f4946] rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 dark:focus:ring-sage-600 focus:border-transparent bg-cream-50 dark:bg-[#2a3330] focus:bg-white dark:focus:bg-[#343c39] text-forest-700 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] transition-colors"
					/>
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Search class="h-5 w-5 text-forest-400 dark:text-[#6B7B6B]" />
					</div>
				</form>
			</div>

			<!-- Right side icons -->
			<div class="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
				<ThemeToggle />

				<!-- Wishlist -->
				<a href="/wishlist" class="relative p-2 text-forest-600 hover:text-forest-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors">
					<Heart class="h-6 w-6" />
					{#if $wishlistCount > 0}
						<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
							{$wishlistCount > 99 ? '99+' : $wishlistCount}
						</span>
					{/if}
				</a>

				<CartIcon />

				<!-- User menu -->
				<div class="relative group">
					<button class="p-2 text-forest-600 hover:text-forest-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors">
						<User class="h-6 w-6" />
					</button>
					<div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-[#2a3330] ring-1 ring-black ring-opacity-5 dark:ring-[#3f4946] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
						<div class="py-1">
							{#if isAuthenticated}
								<div class="px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] border-b border-sage-200 dark:border-[#3f4946]">
									{isSv ? 'Hej' : 'Hello'} {user?.firstName}
								</div>
								<a href="/account" class="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 transition-colors">
									{isSv ? 'Mitt konto' : 'My Account'}
								</a>
								<a href="/account/orders" class="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 transition-colors">
									{isSv ? 'Mina beställningar' : 'My Orders'}
								</a>
								<form method="POST" action="/auth/signout">
									<button type="submit" class="block w-full text-left px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 transition-colors">
										{isSv ? 'Logga ut' : 'Sign Out'}
									</button>
								</form>
							{:else}
								<a href="/auth/signin" class="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 transition-colors">
									{isSv ? 'Logga in' : 'Sign In'}
								</a>
								<a href="/auth/signup" class="block px-4 py-2 text-sm text-forest-700 dark:text-[#B8C5B8] hover:bg-sage-50 dark:hover:bg-[#343c39] hover:text-sage-700 transition-colors">
									{isSv ? 'Skapa konto' : 'Sign Up'}
								</a>
							{/if}
						</div>
					</div>
				</div>

				<!-- Mobile menu button -->
				<button
					on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
					class="lg:hidden p-2 text-forest-600 hover:text-forest-900 dark:text-[#B8C5B8] dark:hover:text-[#E8EDE8] transition-colors"
				>
					{#if isMobileMenuOpen}
						<X class="h-6 w-6" />
					{:else}
						<Menu class="h-6 w-6" />
					{/if}
				</button>
			</div>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if isMobileMenuOpen}
		<div class="lg:hidden border-t border-cream-200 dark:border-[#3f4946] dark:bg-[#242a28]">
			<div class="px-4 py-3 space-y-3">
				<form on:submit={handleSearch} class="relative">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={isSv ? 'Sök produkter...' : 'Search products...'}
						class="w-full pl-10 pr-4 py-2 border border-sage-300 dark:border-[#3f4946] rounded-full focus:outline-none focus:ring-2 focus:ring-sage-500 bg-cream-50 dark:bg-[#2a3330] text-forest-700 dark:text-[#E8EDE8] transition-colors"
					/>
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Search class="h-5 w-5 text-forest-400 dark:text-[#6B7B6B]" />
					</div>
				</form>
				{#each navItems as item}
					<a
						href={item.href}
						class="block py-2 text-forest-700 dark:text-[#B8C5B8] hover:text-sage-700 dark:hover:text-[#E8EDE8] font-medium transition-colors"
						on:click={() => (isMobileMenuOpen = false)}
					>
						{isSv ? item.sv : item.en}
					</a>
				{/each}
			</div>
		</div>
	{/if}
</header>
