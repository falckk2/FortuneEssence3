<script lang="ts">
	import { locale } from '$lib/stores/locale';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';

	let form = { name: '', email: '', subject: '', message: '' };
	let submitting = false;
	let submitted = false;

	async function handleSubmit() {
		submitting = true;
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			});
			const data = await res.json();
			if (data.success) {
				submitted = true;
				toast.success($locale === 'sv' ? 'Meddelande skickat!' : 'Message sent!');
				form = { name: '', email: '', subject: '', message: '' };
			} else {
				toast.error(data.error ?? ($locale === 'sv' ? 'Något gick fel' : 'Something went wrong'));
			}
		} catch {
			toast.error($locale === 'sv' ? 'Kunde inte skicka meddelandet' : 'Failed to send message');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Kontakt' : 'Contact'} – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-16">
	<div class="container mx-auto px-4 max-w-2xl">
		<div class="text-center mb-12">
			<h1 class="text-4xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8] mb-4">
				{$locale === 'sv' ? 'Kontakta oss' : 'Contact us'}
			</h1>
			<p class="text-forest-600 dark:text-[#B8C5B8]">
				{$locale === 'sv' ? 'Vi svarar inom 1–2 arbetsdagar' : 'We respond within 1–2 business days'}
			</p>
		</div>

		{#if submitted}
			<div class="bg-sage-50 dark:bg-sage-900/20 border border-sage-200 dark:border-sage-800 rounded-2xl p-8 text-center">
				<div class="text-4xl mb-4">✅</div>
				<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-2">{$locale === 'sv' ? 'Tack för ditt meddelande!' : 'Thank you for your message!'}</h2>
				<p class="text-forest-600 dark:text-[#B8C5B8]">{$locale === 'sv' ? 'Vi återkommer så snart som möjligt.' : 'We will get back to you as soon as possible.'}</p>
				<button on:click={() => submitted = false} class="mt-4 px-6 py-2 bg-sage-600 text-white rounded-full hover:bg-sage-700 transition-colors">
					{$locale === 'sv' ? 'Skicka nytt meddelande' : 'Send another message'}
				</button>
			</div>
		{:else}
			<form on:submit|preventDefault={handleSubmit} class="bg-white dark:bg-[#2a3330] rounded-2xl p-8 shadow-soft space-y-5">
				{#each [['name', $locale === 'sv' ? 'Namn' : 'Name', 'text'], ['email', $locale === 'sv' ? 'E-post' : 'Email', 'email'], ['subject', $locale === 'sv' ? 'Ämne' : 'Subject', 'text']] as [field, label, type]}
					<div>
						<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">{label}</label>
						<input type={type} bind:value={form[field]} required class="w-full px-4 py-3 border border-cream-300 dark:border-[#4a5552] rounded-xl bg-white dark:bg-[#343c39] dark:text-[#E8EDE8] focus:outline-none focus:ring-2 focus:ring-sage-500" />
					</div>
				{/each}
				<div>
					<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">{$locale === 'sv' ? 'Meddelande' : 'Message'}</label>
					<textarea bind:value={form.message} rows={5} required class="w-full px-4 py-3 border border-cream-300 dark:border-[#4a5552] rounded-xl bg-white dark:bg-[#343c39] dark:text-[#E8EDE8] focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none"></textarea>
				</div>
				<button type="submit" disabled={submitting} class="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium transition-colors disabled:opacity-50">
					{submitting ? ($locale === 'sv' ? 'Skickar...' : 'Sending...') : ($locale === 'sv' ? 'Skicka meddelande' : 'Send message')}
				</button>
			</form>
		{/if}

		<div class="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-center text-sm text-forest-600 dark:text-[#B8C5B8]">
			<div class="bg-white dark:bg-[#2a3330] rounded-xl p-4 shadow-soft">
				<p class="font-medium text-forest-800 dark:text-[#E8EDE8]">📧 {$locale === 'sv' ? 'E-post' : 'Email'}</p>
				<p>info@fortuneessence.se</p>
			</div>
			<div class="bg-white dark:bg-[#2a3330] rounded-xl p-4 shadow-soft">
				<p class="font-medium text-forest-800 dark:text-[#E8EDE8]">⏰ {$locale === 'sv' ? 'Svarstid' : 'Response time'}</p>
				<p>{$locale === 'sv' ? '1–2 arbetsdagar' : '1–2 business days'}</p>
			</div>
		</div>
	</div>
</div>
