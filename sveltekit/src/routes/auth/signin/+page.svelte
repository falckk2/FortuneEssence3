<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';

	let email = '';
	let password = '';
	let showPassword = false;
	let loading = false;
	let error = '';

	async function handleSubmit() {
		loading = true;
		error = '';
		try {
			const result = await signIn('credentials', { email, password, redirect: false });
			if (result?.error) {
				error = $locale === 'sv' ? 'Fel e-postadress eller lösenord.' : 'Invalid email or password.';
			} else {
				goto('/');
			}
		} catch {
			error = $locale === 'sv' ? 'Ett oväntat fel uppstod.' : 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Logga in' : 'Sign in'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-yellow-50 dark:from-[#1a1f1e] dark:via-[#242a28] dark:to-[#1a1f1e] flex items-center justify-center py-12 px-4">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<a href="/" class="inline-flex items-center space-x-2 mb-8">
				<div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-full flex items-center justify-center">
					<span class="text-white font-bold text-sm">FE</span>
				</div>
				<span class="text-2xl font-bold text-forest-900 dark:text-[#E8EDE8]">Fortune Essence</span>
			</a>
			<h2 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8] mb-2">{$locale === 'sv' ? 'Logga In' : 'Sign In'}</h2>
			<p class="text-forest-600 dark:text-[#B8C5B8]">{$locale === 'sv' ? 'Välkommen tillbaka!' : 'Welcome back!'}</p>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="mt-8 space-y-5">
			<div>
				<label for="email" class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-2">{$locale === 'sv' ? 'E-postadress' : 'Email address'}</label>
				<input id="email" type="email" bind:value={email} required autocomplete="email"
					class="block w-full px-4 py-3 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#2a3330] dark:text-[#E8EDE8] focus:outline-none focus:ring-2 focus:ring-sage-500"
					placeholder={$locale === 'sv' ? 'din@email.se' : 'your@email.com'} />
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-2">{$locale === 'sv' ? 'Lösenord' : 'Password'}</label>
				<div class="relative">
					<input id="password" type={showPassword ? 'text' : 'password'} bind:value={password} required autocomplete="current-password"
						class="block w-full px-4 py-3 pr-12 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#2a3330] dark:text-[#E8EDE8] focus:outline-none focus:ring-2 focus:ring-sage-500"
						placeholder={$locale === 'sv' ? 'Ditt lösenord' : 'Your password'} />
					<button type="button" on:click={() => showPassword = !showPassword} class="absolute inset-y-0 right-3 flex items-center text-forest-400 dark:text-[#6B7B6B] hover:text-forest-600 dark:hover:text-[#B8C5B8]">
						{showPassword ? '🙈' : '👁'}
					</button>
				</div>
			</div>

			{#if error}
				<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
					<p class="text-red-600 dark:text-red-400 text-sm">{error}</p>
				</div>
			{/if}

			<div class="flex items-center justify-end">
				<a href="/auth/forgot-password" class="text-sm text-sage-600 hover:text-sage-500 transition-colors">
					{$locale === 'sv' ? 'Glömt lösenord?' : 'Forgot password?'}
				</a>
			</div>

			<button type="submit" disabled={loading} class="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-sage-600 to-sage-700 hover:from-sage-700 hover:to-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
				{#if loading}
					<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
					{$locale === 'sv' ? 'Loggar in...' : 'Signing in...'}
				{:else}
					{$locale === 'sv' ? 'Logga In' : 'Sign In'}
				{/if}
			</button>

			<div class="text-center text-sm text-forest-600 dark:text-[#B8C5B8]">
				{$locale === 'sv' ? 'Inget konto?' : "Don't have an account?"}
				<a href="/auth/signup" class="font-medium text-sage-600 hover:text-sage-500 ml-1">{$locale === 'sv' ? 'Skapa konto' : 'Sign up'}</a>
			</div>
		</form>
	</div>
</div>
