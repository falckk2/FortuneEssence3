<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { locale } from '$lib/stores/locale';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ArrowLeft, Download, Trash2 } from 'lucide-svelte';

	let { data } = $props();
	const session = $derived(data.session);

	let downloading = false;
	let deleting = false;

	onMount(() => { if (!session?.user) goto('/auth/signin'); });

	async function handleExportData() {
		downloading = true;
		try {
			const res = await fetch('/api/gdpr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'export' }) });
			const data = await res.json();
			if (data.success) {
				const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a'); a.href = url; a.download = 'my-data.json'; a.click();
				URL.revokeObjectURL(url);
				toast.success($locale === 'sv' ? 'Data exporterad' : 'Data exported');
			}
		} finally { downloading = false; }
	}

	async function handleDeleteAccount() {
		if (!confirm($locale === 'sv' ? 'Är du säker på att du vill radera ditt konto? Denna åtgärd kan inte ångras.' : 'Are you sure you want to delete your account? This cannot be undone.')) return;
		deleting = true;
		try {
			const res = await fetch('/api/gdpr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete' }) });
			const data = await res.json();
			if (data.success) { toast.success($locale === 'sv' ? 'Konto raderat' : 'Account deleted'); setTimeout(() => goto('/'), 2000); }
			else toast.error(data.error ?? 'Error');
		} finally { deleting = false; }
	}
</script>

<svelte:head><title>{$locale === 'sv' ? 'Integritet & GDPR' : 'Privacy & GDPR'} – Fortune Essence</title></svelte:head>
<Toast />

<div class="min-h-screen bg-cream-50 dark:bg-[#1a1f1e] py-12">
	<div class="container mx-auto px-4 max-w-2xl">
		<a href="/account" class="inline-flex items-center text-forest-600 hover:text-sage-700 mb-6"><ArrowLeft size={20} class="mr-2" />{$locale === 'sv' ? 'Tillbaka' : 'Back'}</a>
		<h1 class="text-3xl font-bold text-forest-900 dark:text-[#E8EDE8] mb-8">{$locale === 'sv' ? 'Integritet & GDPR' : 'Privacy & GDPR'}</h1>

		<div class="space-y-6">
			<div class="bg-white dark:bg-[#2a3330] rounded-2xl p-6 shadow-soft">
				<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-3">{$locale === 'sv' ? 'Exportera mina data' : 'Export my data'}</h2>
				<p class="text-forest-600 dark:text-[#B8C5B8] text-sm mb-4">{$locale === 'sv' ? 'Ladda ner en kopia av alla dina personuppgifter vi har lagrat.' : 'Download a copy of all your personal data we have stored.'}</p>
				<button on:click={handleExportData} disabled={downloading} class="flex items-center gap-2 px-5 py-2.5 bg-sage-600 text-white rounded-full hover:bg-sage-700 disabled:opacity-50 transition-colors">
					<Download size={16} />{downloading ? ($locale === 'sv' ? 'Exporterar...' : 'Exporting...') : ($locale === 'sv' ? 'Exportera data' : 'Export data')}
				</button>
			</div>

			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-red-800 dark:text-red-300 mb-3">{$locale === 'sv' ? 'Radera mitt konto' : 'Delete my account'}</h2>
				<p class="text-red-600 dark:text-red-400 text-sm mb-4">{$locale === 'sv' ? 'Detta raderar permanent alla dina data inklusive orderhistorik. Denna åtgärd kan inte ångras.' : 'This permanently deletes all your data including order history. This cannot be undone.'}</p>
				<button on:click={handleDeleteAccount} disabled={deleting} class="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors">
					<Trash2 size={16} />{deleting ? ($locale === 'sv' ? 'Raderar...' : 'Deleting...') : ($locale === 'sv' ? 'Radera konto' : 'Delete account')}
				</button>
			</div>
		</div>
	</div>
</div>
