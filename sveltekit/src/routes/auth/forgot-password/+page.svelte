<script lang="ts">
	import { locale } from '$lib/stores/locale';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';

	let email = '';
	let submitting = false;
	let emailSent = false;

	async function handleSubmit() {
		if (!email || !email.includes('@')) { toast.error($locale === 'sv' ? 'Ange en giltig e-postadress' : 'Enter a valid email'); return; }
		submitting = true;
		try {
			const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
			const data = await res.json();
			if (data.success) { emailSent = true; toast.success($locale === 'sv' ? 'Återställningslänk skickad!' : 'Reset link sent!'); }
			else toast.error($locale === 'sv' ? 'Något gick fel' : 'Something went wrong');
		} catch { toast.error($locale === 'sv' ? 'Kunde inte skicka länk' : 'Failed to send link'); }
		finally { submitting = false; }
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Glömt lösenord' : 'Forgot password'} – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full">
		<a href="/auth/signin" class="inline-flex items-center text-forest-600 hover:text-sage-700 transition-colors mb-8">
			← <span class="ml-2 font-medium">{$locale === 'sv' ? 'Tillbaka till inloggning' : 'Back to sign in'}</span>
		</a>

		<div class="bg-white rounded-3xl shadow-soft p-8">
			{#if emailSent}
				<div class="text-center">
					<div class="w-16 h-16 mx-auto mb-6 rounded-full bg-sage-100 flex items-center justify-center text-3xl">✅</div>
					<h1 class="text-2xl font-serif font-bold text-forest-800 mb-3">{$locale === 'sv' ? 'E-post skickad!' : 'Email sent!'}</h1>
					<p class="text-forest-600 mb-6">{$locale === 'sv' ? 'Kontrollera din inkorg och följ länken för att återställa ditt lösenord.' : 'Check your inbox and follow the link to reset your password.'}</p>
					<button on:click={() => emailSent = false} class="px-6 py-2 bg-sage-600 text-white rounded-full hover:bg-sage-700">{$locale === 'sv' ? 'Skicka igen' : 'Send again'}</button>
				</div>
			{:else}
				<div class="text-center mb-8">
					<div class="w-16 h-16 mx-auto mb-6 rounded-full bg-sage-100 flex items-center justify-center text-3xl">📧</div>
					<h1 class="text-3xl font-serif font-bold text-forest-800 mb-3">{$locale === 'sv' ? 'Glömt lösenord?' : 'Forgot Password?'}</h1>
					<p class="text-forest-600">{$locale === 'sv' ? 'Ange din e-postadress så skickar vi en återställningslänk.' : "Enter your email and we'll send a reset link."}</p>
				</div>
				<form on:submit|preventDefault={handleSubmit} class="space-y-5">
					<div>
						<label class="block text-sm font-medium text-forest-700 mb-2">{$locale === 'sv' ? 'E-postadress' : 'Email Address'}</label>
						<input type="email" bind:value={email} required disabled={submitting} placeholder={$locale === 'sv' ? 'din@email.se' : 'your@email.com'}
							class="w-full px-4 py-3.5 rounded-2xl border-2 border-cream-300 focus:border-sage-600 focus:outline-none transition-colors" />
					</div>
					<button type="submit" disabled={submitting} class="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium disabled:opacity-50 transition-colors">
						{submitting ? ($locale === 'sv' ? 'Skickar...' : 'Sending...') : ($locale === 'sv' ? 'Skicka återställningslänk' : 'Send reset link')}
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
