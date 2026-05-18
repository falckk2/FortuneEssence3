<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';

	let password = '';
	let confirmPassword = '';
	let submitting = false;
	let success = false;

	$: token = $page.url.searchParams.get('token') ?? '';

	async function handleSubmit() {
		if (password !== confirmPassword) { toast.error($locale === 'sv' ? 'Lösenorden matchar inte' : 'Passwords do not match'); return; }
		if (password.length < 8) { toast.error($locale === 'sv' ? 'Minst 8 tecken' : 'Min 8 characters'); return; }
		submitting = true;
		try {
			const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
			const data = await res.json();
			if (data.success) { success = true; setTimeout(() => goto('/auth/signin'), 3000); }
			else toast.error(data.error ?? ($locale === 'sv' ? 'Något gick fel' : 'Something went wrong'));
		} catch { toast.error($locale === 'sv' ? 'Fel' : 'Error'); }
		finally { submitting = false; }
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Återställ lösenord' : 'Reset password'} – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full">
		<div class="bg-white rounded-3xl shadow-soft p-8">
			{#if success}
				<div class="text-center">
					<div class="text-5xl mb-4">✅</div>
					<h1 class="text-2xl font-serif font-bold text-forest-800 mb-3">{$locale === 'sv' ? 'Lösenord ändrat!' : 'Password changed!'}</h1>
					<p class="text-forest-600">{$locale === 'sv' ? 'Du omdirigeras till inloggning...' : 'Redirecting to sign in...'}</p>
				</div>
			{:else}
				<h1 class="text-2xl font-serif font-bold text-forest-800 mb-6">{$locale === 'sv' ? 'Nytt lösenord' : 'New Password'}</h1>
				<form on:submit|preventDefault={handleSubmit} class="space-y-5">
					{#each [['password', $locale === 'sv' ? 'Lösenord' : 'Password'], ['confirmPassword', $locale === 'sv' ? 'Bekräfta lösenord' : 'Confirm password']] as [field, label]}
						<div>
							<label class="block text-sm font-medium text-forest-700 mb-2">{label}</label>
							<input type="password" bind:value={field === 'password' ? password : confirmPassword} required minlength={8}
								class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors" />
						</div>
					{/each}
					<button type="submit" disabled={submitting || !token} class="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium disabled:opacity-50 transition-colors">
						{submitting ? ($locale === 'sv' ? 'Sparar...' : 'Saving...') : ($locale === 'sv' ? 'Spara nytt lösenord' : 'Save new password')}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
