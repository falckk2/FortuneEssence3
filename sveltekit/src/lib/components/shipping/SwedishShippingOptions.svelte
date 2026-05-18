<script lang="ts">
	import { onMount } from 'svelte';
	import { Truck, Clock, Sparkles, MapPin, Info } from 'lucide-svelte';

	interface ShippingRate {
		id: string;
		name: string;
		description?: string;
		price: number;
		estimatedDays: number;
		maxWeight: number;
	}

	interface CartItem { productId: string; quantity: number; price: number; }

	let {
		postalCode,
		items,
		onRateSelect,
		selectedRateId = undefined,
		locale = 'sv',
	}: {
		postalCode: string;
		items: CartItem[];
		onRateSelect: (rate: ShippingRate) => void;
		selectedRateId?: string;
		locale?: string;
	} = $props();

	let rates: ShippingRate[] = $state([]);
	let ecoOptions: any = $state(null);
	let zoneInfo: any = $state(null);
	let carrierServices: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let showEcoOptions = $state(false);
	let showDetails = $state(false);

	const formatPrice = (n: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(n);

	function getDeliveryText(days: number) {
		if (days === 1) return locale === 'sv' ? 'Nästa arbetsdag' : 'Next business day';
		return locale === 'sv' ? `${days} arbetsdagar` : `${days} business days`;
	}

	function getZoneDescription(zone: string) {
		const map: Record<string, string> = {
			Stockholm: locale === 'sv' ? 'Stockholmsområdet' : 'Stockholm area',
			Göteborg: locale === 'sv' ? 'Göteborgsområdet' : 'Gothenburg area',
			Malmö: locale === 'sv' ? 'Malmöområdet' : 'Malmö area',
			Uppsala: locale === 'sv' ? 'Uppsala län' : 'Uppsala county',
			Norrland: locale === 'sv' ? 'Norra Sverige' : 'Northern Sweden',
			'Övriga Sverige': locale === 'sv' ? 'Övriga Sverige' : 'Rest of Sweden',
		};
		return map[zone] || zone;
	}

	async function loadShippingOptions() {
		loading = true; error = '';
		try {
			const [ratesRes, ecoRes, servicesRes] = await Promise.all([
				fetch('/api/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'calculate-shipping', items, country: 'Sweden', postalCode }) }),
				fetch('/api/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'calculate-eco-shipping', items, country: 'Sweden' }) }),
				fetch('/api/shipping?action=carrier-services'),
			]);

			if (!ratesRes.ok) throw new Error('Failed to load shipping rates');
			const ratesData = await ratesRes.json();
			if (ratesData.success) { rates = ratesData.data.options || []; zoneInfo = ratesData.data.zoneInfo; }

			if (ecoRes.ok) { const d = await ecoRes.json(); if (d.success) ecoOptions = d.data; }
			if (servicesRes.ok) { const d = await servicesRes.json(); if (d.success) carrierServices = d.data; }
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load shipping options';
		} finally { loading = false; }
	}

	onMount(() => { if (postalCode && items.length > 0) loadShippingOptions(); });
</script>

{#if loading}
	<div class="p-6 bg-white dark:bg-[#242a28] rounded-lg shadow-md">
		<div class="animate-pulse space-y-3">
			<div class="h-4 bg-cream-200 dark:bg-[#2a3330] rounded w-1/3 mb-4"></div>
			<div class="h-16 bg-cream-200 dark:bg-[#2a3330] rounded"></div>
			<div class="h-16 bg-cream-200 dark:bg-[#2a3330] rounded"></div>
			<div class="h-16 bg-cream-200 dark:bg-[#2a3330] rounded"></div>
		</div>
	</div>
{:else if error}
	<div class="p-6 bg-white dark:bg-[#242a28] rounded-lg shadow-md text-center text-red-600 dark:text-red-400">
		<p class="font-medium">{locale === 'sv' ? 'Kunde inte ladda leveransalternativ' : 'Could not load shipping options'}</p>
		<p class="text-sm mt-2">{error}</p>
		<button on:click={loadShippingOptions} class="mt-4 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700">
			{locale === 'sv' ? 'Försök igen' : 'Try again'}
		</button>
	</div>
{:else}
	<div class="space-y-4">
		{#if zoneInfo}
			<div class="bg-sage-50 dark:bg-[#2a3330] border border-sage-200 dark:border-[#3f4946] rounded-lg p-4">
				<div class="flex items-center space-x-2">
					<MapPin size={20} class="text-sage-600 dark:text-sage-400" />
					<span class="font-medium text-forest-800 dark:text-[#E8EDE8]">{getZoneDescription(zoneInfo.zone)}</span>
				</div>
				{#if zoneInfo.additionalDays > 0}
					<p class="text-sm text-forest-600 dark:text-[#C5D4C5] mt-1">
						{locale === 'sv' ? `+${zoneInfo.additionalDays} dag(ar) leveranstid på grund av geografiskt läge` : `+${zoneInfo.additionalDays} day(s) additional delivery time due to geographic location`}
					</p>
				{/if}
			</div>
		{/if}

		<div class="bg-white dark:bg-[#242a28] rounded-lg shadow-md p-6">
			<h3 class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8] mb-4">
				{locale === 'sv' ? 'Leveransalternativ' : 'Shipping options'}
			</h3>
			<div class="space-y-3">
				{#each rates as rate}
					<label class="block p-4 border rounded-lg cursor-pointer transition-colors {selectedRateId === rate.id ? 'border-sage-500 bg-sage-50 dark:bg-[#2a3330]' : 'border-cream-200 dark:border-[#3f4946] hover:border-sage-300 dark:hover:border-[#4a5552]'}">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<input type="radio" name="shipping-rate" value={rate.id} checked={selectedRateId === rate.id}
									on:change={() => onRateSelect(rate)}
									class="w-4 h-4 text-sage-600 border-cream-300 dark:border-[#4a5552] focus:ring-sage-500" />
								<div>
									<div class="flex items-center space-x-2">
										<Truck size={20} class="text-forest-400 dark:text-[#8A9A8A]" />
										<span class="font-medium text-forest-900 dark:text-[#E8EDE8]">{rate.name}</span>
									</div>
									{#if rate.description}<p class="text-sm text-forest-600 dark:text-[#C5D4C5] mt-1">{rate.description}</p>{/if}
									<div class="flex items-center space-x-4 mt-1">
										<div class="flex items-center space-x-1">
											<Clock size={16} class="text-forest-400 dark:text-[#8A9A8A]" />
											<span class="text-sm text-forest-600 dark:text-[#C5D4C5]">{getDeliveryText(rate.estimatedDays)}</span>
										</div>
										<span class="text-sm text-forest-500 dark:text-[#8A9A8A]">Max {rate.maxWeight}kg</span>
									</div>
								</div>
							</div>
							<div class="text-right">
								{#if rate.price === 0}
									<span class="font-semibold text-green-600 dark:text-green-400">{locale === 'sv' ? 'Gratis' : 'Free'}</span>
								{:else}
									<span class="font-semibold text-forest-900 dark:text-[#E8EDE8]">{formatPrice(rate.price)}</span>
								{/if}
							</div>
						</div>
					</label>
				{/each}
			</div>
		</div>

		{#if ecoOptions}
			<div class="bg-white dark:bg-[#242a28] rounded-lg shadow-md p-6">
				<div class="flex items-center justify-between mb-4">
					<div class="flex items-center space-x-2">
						<Sparkles size={20} class="text-green-600 dark:text-green-400" />
						<h3 class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8]">
							{locale === 'sv' ? 'Miljövänlig leverans' : 'Eco-friendly shipping'}
						</h3>
					</div>
					<button on:click={() => showEcoOptions = !showEcoOptions}
						class="text-sm text-sage-700 dark:text-sage-400 hover:text-sage-800 dark:hover:text-sage-300 font-medium">
						{showEcoOptions ? (locale === 'sv' ? 'Dölj' : 'Hide') : (locale === 'sv' ? 'Visa alternativ' : 'Show options')}
					</button>
				</div>
				{#if showEcoOptions}
					<label class="block p-4 border rounded-lg cursor-pointer transition-colors {selectedRateId === ecoOptions.ecoRate.id ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-cream-200 dark:border-[#3f4946] hover:border-green-300'}">
						<div class="flex items-center justify-between">
							<div class="flex items-center space-x-3">
								<input type="radio" name="shipping-rate" value={ecoOptions.ecoRate.id}
									checked={selectedRateId === ecoOptions.ecoRate.id}
									on:change={() => onRateSelect(ecoOptions.ecoRate)}
									class="w-4 h-4 text-green-600 border-cream-300 dark:border-[#4a5552] focus:ring-green-500" />
								<div>
									<div class="flex items-center space-x-2">
										<Sparkles size={20} class="text-green-600 dark:text-green-400" />
										<span class="font-medium text-forest-900 dark:text-[#E8EDE8]">{ecoOptions.ecoRate.name}</span>
										<span class="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">CO₂-neutral</span>
									</div>
									<p class="text-sm text-forest-600 dark:text-[#C5D4C5] mt-1">
										{locale === 'sv' ? `Klimatkompenserar ${ecoOptions.carbonOffset.kg}kg CO₂` : `Carbon offsets ${ecoOptions.carbonOffset.kg}kg CO₂`}
									</p>
									<div class="flex items-center space-x-1 mt-1">
										<Clock size={16} class="text-forest-400 dark:text-[#8A9A8A]" />
										<span class="text-sm text-forest-600 dark:text-[#C5D4C5]">{getDeliveryText(ecoOptions.ecoRate.estimatedDays)}</span>
									</div>
								</div>
							</div>
							<div class="text-right">
								<span class="font-semibold text-forest-900 dark:text-[#E8EDE8]">{formatPrice(ecoOptions.ecoRate.price)}</span>
								<p class="text-xs text-green-600 dark:text-green-400">+{formatPrice(ecoOptions.carbonOffset.cost)} {locale === 'sv' ? 'klimatkompensation' : 'carbon offset'}</p>
							</div>
						</div>
					</label>
				{/if}
			</div>
		{/if}

		{#if carrierServices.length > 0}
			<div class="bg-white dark:bg-[#242a28] rounded-lg shadow-md p-6">
				<div class="flex items-center justify-between mb-4">
					<h3 class="text-lg font-semibold text-forest-900 dark:text-[#E8EDE8]">
						{locale === 'sv' ? 'Leverantörsinformation' : 'Carrier information'}
					</h3>
					<button on:click={() => showDetails = !showDetails}
						class="flex items-center space-x-1 text-sm text-sage-700 dark:text-sage-400 hover:text-sage-800 dark:hover:text-sage-300 font-medium">
						<Info size={16} />
						<span>{showDetails ? (locale === 'sv' ? 'Dölj' : 'Hide') : (locale === 'sv' ? 'Visa detaljer' : 'Show details')}</span>
					</button>
				</div>
				{#if showDetails}
					<div class="space-y-4">
						{#each carrierServices as carrier}
							<div class="border border-cream-200 dark:border-[#3f4946] rounded-lg p-4">
								<h4 class="font-medium text-forest-900 dark:text-[#E8EDE8] mb-3">{carrier.carrier}</h4>
								<div class="space-y-2">
									{#each carrier.services as service}
										<div class="text-sm">
											<div class="flex items-center justify-between">
												<span class="font-medium text-forest-800 dark:text-[#E8EDE8]">{service.name}</span>
												<span class="text-forest-500 dark:text-[#8A9A8A]">{getDeliveryText(service.estimatedDays)}</span>
											</div>
											<p class="text-forest-600 dark:text-[#C5D4C5]">{service.description}</p>
											<div class="flex flex-wrap gap-1 mt-1">
												{#each service.features as feature}
													<span class="bg-cream-100 dark:bg-[#2a3330] text-forest-700 dark:text-[#C5D4C5] text-xs px-2 py-1 rounded">{feature}</span>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		{#if rates.some(r => r.price === 0)}
			<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
				<div class="flex items-center space-x-2">
					<div class="w-2 h-2 bg-green-500 rounded-full"></div>
					<span class="text-sm font-medium text-green-800 dark:text-green-300">
						{locale === 'sv' ? 'Gratis frakt på beställningar över 500 SEK' : 'Free shipping on orders over 500 SEK'}
					</span>
				</div>
			</div>
		{/if}
	</div>
{/if}
