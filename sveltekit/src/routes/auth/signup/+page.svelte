<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';

	let form = { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false, newsletter: false };
	let showPassword = false;
	let showConfirm = false;
	let loading = false;
	let errors: Record<string, string> = {};

	function validate() {
		const e: Record<string, string> = {};
		if (!form.firstName.trim()) e.firstName = $locale === 'sv' ? 'Förnamn krävs' : 'First name required';
		if (!form.lastName.trim()) e.lastName = $locale === 'sv' ? 'Efternamn krävs' : 'Last name required';
		if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = $locale === 'sv' ? 'Ogiltig e-post' : 'Invalid email';
		if (!form.password || form.password.length < 8) e.password = $locale === 'sv' ? 'Minst 8 tecken' : 'Min 8 characters';
		if (form.password !== form.confirmPassword) e.confirmPassword = $locale === 'sv' ? 'Lösenorden matchar inte' : 'Passwords do not match';
		if (!form.acceptTerms) e.acceptTerms = $locale === 'sv' ? 'Acceptera villkoren' : 'Accept terms';
		errors = e;
		return Object.keys(e).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;
		loading = true;
		try {
			const res = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password, marketingOptIn: form.newsletter }),
			});
			const data = await res.json();
			if (!data.success) { errors.submit = data.error ?? 'Error'; return; }

			const signInResult = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
			if (signInResult?.error) goto('/auth/signin?message=account-created');
			else goto('/');
		} catch {
			errors.submit = $locale === 'sv' ? 'Ett fel uppstod' : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Skapa konto' : 'Create account'} – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-gradient-to-br from-yellow-50 via-purple-50 to-yellow-50 flex items-center justify-center py-12 px-4">
	<div class="max-w-md w-full space-y-8">
		<div class="text-center">
			<a href="/" class="inline-flex items-center space-x-2 mb-8">
				<div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-full flex items-center justify-center">
					<span class="text-white font-bold text-sm">FE</span>
				</div>
				<span class="text-2xl font-bold text-forest-900">Fortune Essence</span>
			</a>
			<h2 class="text-3xl font-bold text-forest-900 mb-2">{$locale === 'sv' ? 'Skapa Konto' : 'Create Account'}</h2>
		</div>

		<form on:submit|preventDefault={handleSubmit} class="mt-8 space-y-4">
			<div class="grid grid-cols-2 gap-4">
				{#each [['firstName', $locale === 'sv' ? 'Förnamn' : 'First name'], ['lastName', $locale === 'sv' ? 'Efternamn' : 'Last name']] as [field, label]}
					<div>
						<label class="block text-sm font-medium text-forest-700 mb-1">{label} *</label>
						<input type="text" bind:value={form[field]} required class="block w-full px-3 py-3 border {errors[field] ? 'border-red-300' : 'border-cream-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500" />
						{#if errors[field]}<p class="mt-1 text-xs text-red-600">{errors[field]}</p>{/if}
					</div>
				{/each}
			</div>

			{#each [['email', $locale === 'sv' ? 'E-post' : 'Email', 'email'], ['phone', $locale === 'sv' ? 'Telefon (valfritt)' : 'Phone (optional)', 'tel']] as [field, label, type]}
				<div>
					<label class="block text-sm font-medium text-forest-700 mb-1">{label}</label>
					<input type={type} bind:value={form[field]} required={field === 'email'} class="block w-full px-3 py-3 border {errors[field] ? 'border-red-300' : 'border-cream-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500" />
					{#if errors[field]}<p class="mt-1 text-xs text-red-600">{errors[field]}</p>{/if}
				</div>
			{/each}

			{#each [['password', $locale === 'sv' ? 'Lösenord' : 'Password', showPassword], ['confirmPassword', $locale === 'sv' ? 'Bekräfta lösenord' : 'Confirm password', showConfirm]] as [field, label, show], i}
				<div>
					<label class="block text-sm font-medium text-forest-700 mb-1">{label} *</label>
					<div class="relative">
						<input type={show ? 'text' : 'password'} bind:value={form[field]} required class="block w-full px-3 py-3 pr-12 border {errors[field] ? 'border-red-300' : 'border-cream-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500" />
						<button type="button" on:click={() => i === 0 ? showPassword = !showPassword : showConfirm = !showConfirm} class="absolute inset-y-0 right-3 flex items-center text-forest-400">{show ? '🙈' : '👁'}</button>
					</div>
					{#if errors[field]}<p class="mt-1 text-xs text-red-600">{errors[field]}</p>{/if}
				</div>
			{/each}

			<div class="space-y-3">
				<label class="flex items-start gap-3 cursor-pointer">
					<input type="checkbox" bind:checked={form.acceptTerms} class="mt-0.5 h-4 w-4 text-sage-600 rounded border-cream-300" />
					<span class="text-sm text-forest-700">
						{$locale === 'sv' ? 'Jag accepterar ' : 'I accept the '}
						<a href="/terms" class="text-sage-600 hover:text-sage-500">{$locale === 'sv' ? 'användarvillkoren' : 'terms'}</a>
						{$locale === 'sv' ? ' och ' : ' and '}
						<a href="/privacy" class="text-sage-600 hover:text-sage-500">{$locale === 'sv' ? 'integritetspolicyn' : 'privacy policy'}</a> *
					</span>
				</label>
				{#if errors.acceptTerms}<p class="text-xs text-red-600">{errors.acceptTerms}</p>{/if}

				<label class="flex items-start gap-3 cursor-pointer">
					<input type="checkbox" bind:checked={form.newsletter} class="mt-0.5 h-4 w-4 text-sage-600 rounded border-cream-300" />
					<span class="text-sm text-forest-700">{$locale === 'sv' ? 'Jag vill få nyhetsbrev' : 'I want to receive newsletters'}</span>
				</label>
			</div>

			{#if errors.submit}
				<div class="bg-red-50 border border-red-200 rounded-lg p-3">
					<p class="text-red-600 text-sm">{errors.submit}</p>
				</div>
			{/if}

			<button type="submit" disabled={loading} class="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all">
				{loading ? ($locale === 'sv' ? 'Skapar...' : 'Creating...') : ($locale === 'sv' ? 'Skapa Konto' : 'Create Account')}
			</button>

			<div class="text-center text-sm text-forest-600">
				{$locale === 'sv' ? 'Har du redan ett konto?' : 'Already have an account?'}
				<a href="/auth/signin" class="font-medium text-sage-600 hover:text-sage-500 ml-1">{$locale === 'sv' ? 'Logga in' : 'Sign in'}</a>
			</div>
		</form>
	</div>
</div>
