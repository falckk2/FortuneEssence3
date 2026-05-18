<script lang="ts">
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { Store, Archive, UserCircle, Check } from 'lucide-svelte';

	let { data } = $props();
	const session = data.session;

	let threshold = '5';
	let savingThreshold = false;
	let thresholdSaved = false;

	const displayName = (session?.user as any)?.firstName && (session?.user as any)?.lastName
		? `${(session.user as any).firstName} ${(session.user as any).lastName}`
		: session?.user?.name || '—';

	async function handleSaveThreshold() {
		const level = parseInt(threshold);
		if (isNaN(level) || level < 0) { toast.error('Ange ett giltigt tröskelvärde'); return; }
		savingThreshold = true;
		try {
			await new Promise(r => setTimeout(r, 400));
			thresholdSaved = true;
			toast.success('Tröskelvärde uppdaterat');
			setTimeout(() => { thresholdSaved = false; }, 2000);
		} finally { savingThreshold = false; }
	}
</script>

<Toast />
<div class="max-w-2xl mx-auto space-y-6">
	<div>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Inställningar</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Butikskonfiguration och inställningar</p>
	</div>

	<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
		<div class="flex items-center gap-3 mb-4">
			<Store size={24} class="text-sage-600" />
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Butiksinställningar</h2>
		</div>
		<div class="space-y-3">
			{#each [
				{ label: 'Butiksnamn', value: 'FortuneEssence' },
				{ label: 'Valuta', value: 'SEK (kr)' },
				{ label: 'Land', value: 'Sverige' },
				{ label: 'Standardspråk', value: 'Svenska (sv)', last: true },
			] as row}
				<div class="flex items-center justify-between py-3 {row.last ? '' : 'border-b border-cream-200 dark:border-[#3f4946]'}">
					<span class="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">{row.label}</span>
					<span class="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">{row.value}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
		<div class="flex items-center gap-3 mb-4">
			<Archive size={24} class="text-sage-600" />
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Lagertrösklar</h2>
		</div>
		<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-4">
			Produkter med lagersaldo vid eller under detta värde flaggas som "Lågt lager" i lagervy.
		</p>
		<div class="flex items-center gap-3">
			<div class="flex-1">
				<label for="low-stock-threshold" class="block text-sm font-medium text-forest-700 dark:text-[#C5D4C5] mb-1">
					Tröskel för lagervarning
				</label>
				<input id="low-stock-threshold" type="number" min="0" bind:value={threshold}
					class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none transition-colors" />
			</div>
			<div class="pt-6">
				<button on:click={handleSaveThreshold} disabled={savingThreshold}
					class="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-sage-600 text-white font-medium hover:bg-sage-700 transition-all disabled:opacity-50">
					{#if thresholdSaved}
						<Check size={16} />Sparat
					{:else if savingThreshold}
						Sparar...
					{:else}
						Spara
					{/if}
				</button>
			</div>
		</div>
	</div>

	<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
		<div class="flex items-center gap-3 mb-4">
			<UserCircle size={24} class="text-sage-600" />
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Administratörskonto</h2>
		</div>
		<div class="space-y-3">
			<div class="flex items-center justify-between py-3 border-b border-cream-200 dark:border-[#3f4946]">
				<span class="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Namn</span>
				<span class="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">{displayName}</span>
			</div>
			<div class="flex items-center justify-between py-3 border-b border-cream-200 dark:border-[#3f4946]">
				<span class="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">E-post</span>
				<span class="text-sm text-forest-800 dark:text-[#E8EDE8] font-semibold">{session?.user?.email || '—'}</span>
			</div>
			<div class="flex items-center justify-between py-3">
				<span class="text-sm font-medium text-forest-600 dark:text-[#8A9A8A]">Roll</span>
				<span class="px-3 py-1 rounded-full text-xs font-medium bg-sage-100 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300 border border-sage-200 dark:border-sage-700">
					Administratör
				</span>
			</div>
		</div>
	</div>
</div>
