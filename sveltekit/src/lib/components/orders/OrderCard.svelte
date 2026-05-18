<script lang="ts">
	import { Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp } from 'lucide-svelte';

	interface OrderItem {
		id: string;
		name: string;
		nameSwedish?: string;
		quantity: number;
		price: number;
		imageUrl?: string;
	}

	interface Order {
		id: string;
		status: string;
		createdAt: string;
		totalAmount: number;
		items: OrderItem[];
		trackingNumber?: string;
		estimatedDelivery?: string;
	}

	let { order, locale = 'sv', onCancel }: { order: Order; locale?: string; onCancel?: (id: string) => Promise<void> } = $props();

	let expanded = $state(false);
	let cancelling = $state(false);

	const statusIcons: Record<string, any> = {
		pending: Clock,
		confirmed: CheckCircle,
		shipped: Truck,
		delivered: CheckCircle,
		cancelled: XCircle,
	};

	const statusTexts: Record<string, Record<string, string>> = {
		pending: { sv: 'Väntar', en: 'Pending' },
		confirmed: { sv: 'Bekräftad', en: 'Confirmed' },
		shipped: { sv: 'Skickad', en: 'Shipped' },
		delivered: { sv: 'Levererad', en: 'Delivered' },
		cancelled: { sv: 'Avbruten', en: 'Cancelled' },
	};

	const statusColors: Record<string, string> = {
		pending: 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30',
		confirmed: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30',
		shipped: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30',
		delivered: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30',
		cancelled: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
	};

	const iconColors: Record<string, string> = {
		pending: 'text-yellow-600 dark:text-yellow-400',
		confirmed: 'text-green-600 dark:text-green-400',
		shipped: 'text-blue-600 dark:text-blue-400',
		delivered: 'text-green-600 dark:text-green-400',
		cancelled: 'text-red-600 dark:text-red-400',
	};

	const formatDate = (d: string) => new Date(d).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	const statusKey = order.status.toLowerCase();
	const StatusIcon = statusIcons[statusKey] || Clock;
	const iconColor = iconColors[statusKey] || 'text-forest-500 dark:text-[#8A9A8A]';
	const statusText = (statusTexts[statusKey]?.[locale as 'sv' | 'en']) || order.status;
	const statusColor = statusColors[statusKey] || 'text-forest-700 bg-cream-100 dark:text-[#C5D4C5] dark:bg-[#2a3330]';
	const canCancel = ['pending', 'confirmed'].includes(statusKey);

	async function handleCancel() {
		if (!onCancel || !canCancel) return;
		cancelling = true;
		try { await onCancel(order.id); } finally { cancelling = false; }
	}
</script>

<div class="bg-white dark:bg-[#242a28] rounded-lg shadow-md border border-cream-200 dark:border-[#3f4946] overflow-hidden">
	<div class="p-6">
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center space-x-3">
				<StatusIcon size={20} class={iconColor} />
				<div>
					<p class="font-semibold text-forest-900 dark:text-[#E8EDE8]">
						{locale === 'sv' ? 'Beställning' : 'Order'} #{order.id}
					</p>
					<p class="text-sm text-forest-600 dark:text-[#C5D4C5]">{formatDate(order.createdAt)}</p>
				</div>
			</div>
			<div class="text-right">
				<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium {statusColor}">{statusText}</span>
				<p class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8] mt-2">{formatPrice(order.totalAmount)}</p>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-forest-600 dark:text-[#C5D4C5]">
					{order.items.length} {locale === 'sv' ? 'artiklar' : 'items'}
				</p>
				{#if order.trackingNumber}
					<p class="text-sm text-sage-700 dark:text-sage-400">
						{locale === 'sv' ? 'Spårning:' : 'Tracking:'} {order.trackingNumber}
					</p>
				{/if}
			</div>
			<button on:click={() => expanded = !expanded}
				class="flex items-center text-sage-700 dark:text-sage-400 hover:text-sage-800 dark:hover:text-sage-300 text-sm font-medium">
				{expanded ? (locale === 'sv' ? 'Dölj detaljer' : 'Hide details') : (locale === 'sv' ? 'Visa detaljer' : 'Show details')}
				{#if expanded}<ChevronUp size={16} class="ml-1" />{:else}<ChevronDown size={16} class="ml-1" />{/if}
			</button>
		</div>
	</div>

	{#if expanded}
		<div class="border-t border-cream-200 dark:border-[#3f4946] bg-cream-50 dark:bg-[#1e2421]">
			<div class="p-6">
				<div class="space-y-4 mb-6">
					{#each order.items as item}
						<div class="flex items-center space-x-4">
							<div class="flex-shrink-0">
								{#if item.imageUrl}
									<img src={item.imageUrl} alt={item.name} class="w-16 h-16 object-cover rounded-md" />
								{:else}
									<div class="w-16 h-16 bg-cream-200 dark:bg-[#2a3330] rounded-md flex items-center justify-center">
										<span class="text-forest-400 dark:text-[#6B7B6B] text-xs">{locale === 'sv' ? 'Ingen bild' : 'No image'}</span>
									</div>
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-forest-900 dark:text-[#E8EDE8] truncate">
									{locale === 'sv' && item.nameSwedish ? item.nameSwedish : item.name}
								</p>
								<p class="text-sm text-forest-600 dark:text-[#C5D4C5]">
									{locale === 'sv' ? 'Antal:' : 'Quantity:'} {item.quantity}
								</p>
							</div>
							<div class="text-sm font-medium text-forest-900 dark:text-[#E8EDE8]">
								{formatPrice(item.price * item.quantity)}
							</div>
						</div>
					{/each}
				</div>

				{#if order.estimatedDelivery}
					<div class="mb-6 p-4 bg-sage-50 dark:bg-[#2a3330] rounded-lg border border-sage-200 dark:border-[#3f4946]">
						<p class="text-sm font-medium text-forest-800 dark:text-[#E8EDE8]">
							{locale === 'sv' ? 'Beräknad leverans' : 'Estimated delivery'}
						</p>
						<p class="text-sm text-forest-600 dark:text-[#C5D4C5]">{formatDate(order.estimatedDelivery)}</p>
					</div>
				{/if}

				<div class="flex flex-col sm:flex-row gap-3">
					{#if order.trackingNumber}
						<a href="/orders/track?tracking={order.trackingNumber}"
							class="flex-1 text-center px-4 py-2 bg-sage-600 text-white font-medium rounded-lg hover:bg-sage-700 transition-colors">
							{locale === 'sv' ? 'Spåra paket' : 'Track package'}
						</a>
					{/if}
					<a href="/account/orders/{order.id}"
						class="flex-1 text-center px-4 py-2 border border-sage-600 dark:border-sage-500 text-sage-700 dark:text-sage-400 font-medium rounded-lg hover:bg-sage-50 dark:hover:bg-[#2a3330] transition-colors">
						{locale === 'sv' ? 'Visa detaljer' : 'View details'}
					</a>
					{#if canCancel && onCancel}
						<button on:click={handleCancel} disabled={cancelling}
							class="flex-1 px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
							{cancelling ? (locale === 'sv' ? 'Avbryter...' : 'Cancelling...') : (locale === 'sv' ? 'Avbryt order' : 'Cancel order')}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
