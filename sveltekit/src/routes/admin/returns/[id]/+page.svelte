<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toast } from '$lib/stores/toast';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ArrowLeft, CheckCircle, XCircle, Inbox, Banknote } from 'lucide-svelte';

	$: id = $page.params.id;
	let returnData: any = null;
	let loading = true;
	let error = false;
	let actionLoading = false;
	let adminNotes = '';
	let rejectReason = '';
	let showRejectModal = false;
	let showRefundConfirm = false;

	const statusLabels: Record<string, string> = { pending: 'Väntande', approved: 'Godkänd', rejected: 'Avslagen', received: 'Mottagen', refunded: 'Återbetald', cancelled: 'Avbruten' };
	const statusColors: Record<string, string> = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
		approved: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
		rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
		received: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
		refunded: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
		cancelled: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#343c39] dark:text-[#8A9A8A] dark:border-[#4a5552]',
	};
	const conditionLabels: Record<string, string> = { unopened: 'Oöppnad', opened: 'Öppnad', damaged: 'Skadad', defective: 'Defekt' };
	const conditionColors: Record<string, string> = {
		unopened: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
		opened: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
		damaged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
		defective: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
	};
	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	async function fetchReturn() {
		error = false;
		try {
			const res = await fetch(`/api/admin/returns/${id}`);
			const data = await res.json();
			if (data.success) { returnData = data.data; adminNotes = data.data.adminNotes || ''; }
			else { toast.error('Kunde inte ladda retur'); error = true; }
		} catch { toast.error('Kunde inte ladda retur'); error = true; } finally { loading = false; }
	}

	onMount(fetchReturn);

	async function handleAction(action: string, extraData?: Record<string, string>) {
		actionLoading = true;
		try {
			const body: Record<string, string> = { action, ...extraData };
			if (adminNotes && action !== 'reject') body.adminNotes = adminNotes;
			const res = await fetch(`/api/admin/returns/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
			const data = await res.json();
			if (data.success) {
				returnData = data.data; adminNotes = data.data.adminNotes || '';
				showRejectModal = false; showRefundConfirm = false;
				const msgs: Record<string, string> = { approve: 'Retur godkänd', reject: 'Retur avslagen', receive: 'Markerad som mottagen', refund: 'Återbetalning bearbetad', 'mark-refunded': 'Markerad som återbetald' };
				toast.success(msgs[action] || 'Uppdaterad');
			} else toast.error(data.error || 'Åtgärden misslyckades');
		} catch { toast.error('Något gick fel'); } finally { actionLoading = false; }
	}

	$: itemsSubtotal = returnData?.items?.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0) ?? 0;
</script>

<Toast />
{#if loading}
	<div class="flex items-center justify-center h-96"><div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div></div>
{:else if error}
	<div class="flex flex-col items-center justify-center h-96 gap-4">
		<p class="text-forest-600 dark:text-[#C5D4C5]">Kunde inte ladda retur</p>
		<button on:click={fetchReturn} class="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">Försök igen</button>
	</div>
{:else if returnData}
	<div class="space-y-6 max-w-4xl">
		<div class="flex items-center gap-4">
			<a href="/admin/returns" class="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors"><ArrowLeft size={20} class="text-forest-700 dark:text-[#C5D4C5]" /></a>
			<div class="flex-1">
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Retur #{returnData.id.substring(0, 8)}</h1>
					<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border {statusColors[returnData.status] || 'bg-gray-100'}">
						{statusLabels[returnData.status] || returnData.status}
					</span>
				</div>
				<div class="flex gap-4 mt-1 text-sm text-forest-600 dark:text-[#8A9A8A]">
					<span>Skapad: {new Date(returnData.createdAt).toLocaleDateString('sv-SE')}</span>
					{#if returnData.approvedAt}<span>Godkänd: {new Date(returnData.approvedAt).toLocaleDateString('sv-SE')}</span>{/if}
					{#if returnData.receivedAt}<span>Mottagen: {new Date(returnData.receivedAt).toLocaleDateString('sv-SE')}</span>{/if}
					{#if returnData.refundedAt}<span>Återbetald: {new Date(returnData.refundedAt).toLocaleDateString('sv-SE')}</span>{/if}
				</div>
			</div>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Orderinformation</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div><span class="text-sm text-forest-600 dark:text-[#8A9A8A]">Order-ID</span>
					<p class="font-medium"><a href="/admin/orders/{returnData.orderId}" class="text-sage-700 dark:text-sage-400 hover:underline">#{returnData.orderId.substring(0, 8)}</a></p>
				</div>
				<div><span class="text-sm text-forest-600 dark:text-[#8A9A8A]">Kund</span><p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.customerName || 'N/A'}</p></div>
				<div><span class="text-sm text-forest-600 dark:text-[#8A9A8A]">E-post</span><p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.customerEmail || 'N/A'}</p></div>
				<div><span class="text-sm text-forest-600 dark:text-[#8A9A8A]">Betalningsmetod</span><p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.orderPaymentMethod || 'N/A'}</p></div>
			</div>
			<div class="mt-4"><span class="text-sm text-forest-600 dark:text-[#8A9A8A]">Returorsak</span><p class="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.reason}</p></div>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden border border-transparent dark:border-[#3f4946]">
			<div class="p-6 border-b border-cream-200 dark:border-[#3f4946]"><h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Returartiklar</h2></div>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
						<tr>
							{#each ['Produkt', 'Antal', 'Pris', 'Skick', 'Orsak'] as th}
								<th class="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase">{th}</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-cream-200 dark:divide-[#3f4946]">
						{#each returnData.items as item}
							<tr class="hover:bg-cream-50 dark:hover:bg-[#2a3330]">
								<td class="px-6 py-4 text-forest-800 dark:text-[#E8EDE8] font-medium">{item.productName || item.productId.substring(0, 8)}</td>
								<td class="px-6 py-4 text-forest-700 dark:text-[#C5D4C5]">{item.quantity}</td>
								<td class="px-6 py-4 text-forest-700 dark:text-[#C5D4C5]">{item.price ? formatPrice(item.price * item.quantity) : 'N/A'}</td>
								<td class="px-6 py-4">
									{#if item.condition}
										<span class="inline-flex px-2 py-1 rounded-full text-xs font-medium {conditionColors[item.condition] || 'bg-gray-100 dark:bg-[#343c39]'}">
											{conditionLabels[item.condition] || item.condition}
										</span>
									{/if}
								</td>
								<td class="px-6 py-4 text-sm text-forest-600 dark:text-[#8A9A8A]">{item.reason || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Återbetalningssammanfattning</h2>
			<div class="space-y-2">
				<div class="flex justify-between text-forest-700 dark:text-[#C5D4C5]"><span>Artiklar delsumma</span><span>{formatPrice(itemsSubtotal)}</span></div>
				<div class="flex justify-between text-forest-800 dark:text-[#E8EDE8] font-bold text-lg border-t border-cream-200 dark:border-[#3f4946] pt-2">
					<span>Total återbetalning</span><span>{formatPrice(returnData.refundAmount)}</span>
				</div>
			</div>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Adminanteckningar</h2>
			<textarea bind:value={adminNotes} placeholder="Interna anteckningar..." rows={3}
				class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 focus:border-sage-600 focus:outline-none resize-none"></textarea>
		</div>

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
			<h2 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Åtgärder</h2>
			{#if returnData.status === 'pending'}
				<div class="flex gap-3">
					<button on:click={() => handleAction('approve')} disabled={actionLoading}
						class="flex items-center gap-2 px-6 py-3 bg-sage-600 text-white rounded-xl hover:bg-sage-700 transition-colors disabled:opacity-50">
						<CheckCircle size={20} />Godkänn
					</button>
					<button on:click={() => showRejectModal = true} disabled={actionLoading}
						class="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50">
						<XCircle size={20} />Avslå
					</button>
				</div>
			{:else if returnData.status === 'approved'}
				<button on:click={() => handleAction('receive')} disabled={actionLoading}
					class="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50">
					<Inbox size={20} />Markera som mottagen
				</button>
			{:else if returnData.status === 'received'}
				{#if ['stripe', 'card'].includes(returnData.orderPaymentMethod || 'stripe')}
					<button on:click={() => showRefundConfirm = true} disabled={actionLoading}
						class="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
						<Banknote size={20} />Bearbeta återbetalning
					</button>
				{:else}
					<div class="space-y-2">
						<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">Automatisk återbetalning stöds ej. Bearbeta manuellt och markera sedan som återbetald.</p>
						<button on:click={() => handleAction('mark-refunded')} disabled={actionLoading}
							class="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50">
							<Banknote size={20} />Markera som återbetald
						</button>
					</div>
				{/if}
			{:else}
				<p class="text-forest-600 dark:text-[#8A9A8A]">Denna retur är {statusLabels[returnData.status]?.toLowerCase() || returnData.status}. Inga ytterligare åtgärder tillgängliga.</p>
			{/if}
		</div>
	</div>

	{#if showRejectModal}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-white dark:bg-[#242a28] rounded-2xl p-6 max-w-md w-full mx-4">
				<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Avslå retur</h3>
				<textarea bind:value={rejectReason} placeholder="Ange orsak för avslag..." rows={3}
					class="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] focus:border-sage-600 focus:outline-none resize-none mb-4"></textarea>
				<div class="flex gap-3 justify-end">
					<button on:click={() => showRejectModal = false} class="px-4 py-2 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-50 transition-colors">Avbryt</button>
					<button on:click={() => handleAction('reject', { reason: rejectReason })} disabled={!rejectReason.trim() || actionLoading}
						class="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">Avslå</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showRefundConfirm}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div class="bg-white dark:bg-[#242a28] rounded-2xl p-6 max-w-md w-full mx-4">
				<h3 class="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Bekräfta återbetalning</h3>
				<p class="text-forest-700 dark:text-[#C5D4C5] mb-2">Är du säker på att du vill bearbeta en återbetalning på <span class="font-bold">{formatPrice(returnData.refundAmount)}</span>?</p>
				<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-4">Återbetalningen sker via {returnData.orderPaymentMethod || 'Stripe'}.</p>
				<div class="flex gap-3 justify-end">
					<button on:click={() => showRefundConfirm = false} class="px-4 py-2 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-50 transition-colors">Avbryt</button>
					<button on:click={() => handleAction('refund')} disabled={actionLoading} class="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
						{actionLoading ? 'Bearbetar...' : 'Bekräfta återbetalning'}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
