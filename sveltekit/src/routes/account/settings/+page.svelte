<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ArrowLeft } from 'lucide-svelte';

	let { data } = $props();
	const session = $derived(data.session);

	let form = { firstName: '', lastName: '', email: '', phone: '' };
	let saving = false;

	onMount(() => {
		if (!session?.user) { goto('/auth/signin'); return; }
		if (session.user.name) {
			const [first, ...rest] = (session.user.name as string).split(' ');
			form.firstName = first;
			form.lastName = rest.join(' ');
		}
		form.email = session.user.email ?? '';
	});

	async function handleSave() {
		saving = true;
		try {
			const res = await fetch('/api/account/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
			const d = await res.json();
			if (d.success) toast.success($locale === 'sv' ? 'Inställningar sparade' : 'Settings saved');
			else toast.error(d.error ?? 'Error');
		} finally { saving = false; }
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Kontoinställningar' : 'Account settings'} – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-12">
	<div class="container mx-auto px-4 max-w-2xl">
		<a href="/account" class="inline-flex items-center text-forest-600 hover:text-sage-700 mb-6"><ArrowLeft size={20} class="mr-2" />{$locale === 'sv' ? 'Tillbaka' : 'Back'}</a>
		<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8] mb-8">{$locale === 'sv' ? 'Kontoinställningar' : 'Account Settings'}</h1>
		<form on:submit|preventDefault={handleSave} class="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft space-y-5">
			<div class="grid grid-cols-2 gap-4">
				{#each [['firstName', $locale === 'sv' ? 'Förnamn' : 'First name'], ['lastName', $locale === 'sv' ? 'Efternamn' : 'Last name']] as [field, label]}
					<div>
						<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">{label}</label>
						<input type="text" bind:value={form[field]} class="w-full px-3 py-2.5 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#343c39] dark:text-[#E8EDE8] focus:outline-none focus:ring-2 focus:ring-sage-500" />
					</div>
				{/each}
			</div>
			{#each [['email', $locale === 'sv' ? 'E-post' : 'Email', 'email'], ['phone', $locale === 'sv' ? 'Telefon' : 'Phone', 'tel']] as [field, label, type]}
				<div>
					<label class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">{label}</label>
					<input type={type} bind:value={form[field]} class="w-full px-3 py-2.5 border border-cream-300 dark:border-[#4a5552] rounded-lg bg-white dark:bg-[#343c39] dark:text-[#E8EDE8] focus:outline-none focus:ring-2 focus:ring-sage-500" />
				</div>
			{/each}
			<button type="submit" disabled={saving} class="w-full py-3 bg-sage-600 hover:bg-sage-700 text-white rounded-full font-medium disabled:opacity-50 transition-colors">
				{saving ? ($locale === 'sv' ? 'Sparar...' : 'Saving...') : ($locale === 'sv' ? 'Spara ändringar' : 'Save changes')}
			</button>
		</form>
	</div>
</div>
