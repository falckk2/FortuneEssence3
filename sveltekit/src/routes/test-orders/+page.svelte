<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const session = $derived(data.session);

	let orderId = '';
	let isLoading = false;
	let result: any = null;
	let orders: any[] = [];

	let testData = {
		customerId: '',
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		street: 'Testgatan 123',
		city: 'Stockholm',
		postalCode: '11122',
		country: 'Sweden',
		productId: '',
		quantity: 1,
		price: 299,
	};

	onMount(() => {
		if (!session?.user) { goto('/auth/signin'); return; }
		testData.customerId = (session.user as any).id || '';
	});

	async function handleCreateTestOrder() {
		const customerId = testData.customerId || (session?.user as any)?.id;
		if (!customerId) { alert('Customer ID is required. Please sign in or enter a valid customer UUID.'); return; }
		isLoading = true;
		result = null;
		try {
			const res = await fetch('/api/test/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					customerId,
					email: testData.email,
					items: [{ productId: testData.productId, quantity: testData.quantity, price: testData.price }],
					shippingAddress: { firstName: testData.firstName, lastName: testData.lastName, street: testData.street, city: testData.city, postalCode: testData.postalCode, country: testData.country },
					billingAddress: { firstName: testData.firstName, lastName: testData.lastName, street: testData.street, city: testData.city, postalCode: testData.postalCode, country: testData.country },
					paymentMethod: 'card',
				}),
			});
			result = await res.json();
			if (result.success && result.data?.order?.id) orderId = result.data.order.id;
		} finally { isLoading = false; }
	}

	async function shipmentAction(action: string) {
		if (!orderId) { alert('Please create an order first or enter an order ID'); return; }
		isLoading = true;
		result = null;
		try {
			const res = await fetch('/api/test/shipment/simulate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, orderId }),
			});
			result = await res.json();
		} finally { isLoading = false; }
	}

	async function handleLoadUserOrders() {
		const userId = testData.customerId || (session?.user as any)?.id;
		if (!userId) { alert('Please enter a user ID or sign in'); return; }
		isLoading = true;
		try {
			const res = await fetch(`/api/test/orders?action=list-user-orders&userId=${userId}`);
			const data = await res.json();
			if (data.success) orders = data.data ?? [];
		} finally { isLoading = false; }
	}

	async function handleCleanup() {
		if (!confirm('Are you sure you want to delete all test orders?')) return;
		isLoading = true;
		try {
			const res = await fetch('/api/test/orders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cleanup-test-orders' }) });
			result = await res.json();
			orders = [];
		} finally { isLoading = false; }
	}
</script>

<svelte:head><title>Test Order System – Fortune Essence</title></svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-[#1a1f1e] py-8 px-4">
	<div class="max-w-6xl mx-auto">
		<div class="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-700 rounded-lg p-4 mb-6">
			<h1 class="text-2xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">Test Order System</h1>
			<p class="text-yellow-700 dark:text-yellow-400">
				This is a testing interface for simulating orders and payments without processing real charges.
				All test orders are marked and can be cleaned up.
			</p>
		</div>

		<div class="bg-white dark:bg-[#2a3330] rounded-lg shadow-md p-6 mb-6">
			<h2 class="text-xl font-semibold dark:text-[#E8EDE8] mb-4">Test Order Data</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-sm font-medium dark:text-[#C5D4C5] mb-1">Customer ID</label>
					<input type="text" bind:value={testData.customerId} class="w-full px-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" placeholder={(session?.user as any)?.id || 'Enter customer ID'} />
				</div>
				<div>
					<label class="block text-sm font-medium dark:text-[#C5D4C5] mb-1">Email</label>
					<input type="email" bind:value={testData.email} class="w-full px-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" />
				</div>
				<div>
					<label class="block text-sm font-medium dark:text-[#C5D4C5] mb-1">Product ID</label>
					<input type="text" bind:value={testData.productId} class="w-full px-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" placeholder="Enter a valid product ID" />
				</div>
				<div>
					<label class="block text-sm font-medium dark:text-[#C5D4C5] mb-1">Price (SEK)</label>
					<input type="number" bind:value={testData.price} class="w-full px-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" />
				</div>
			</div>
		</div>

		<div class="bg-white dark:bg-[#2a3330] rounded-lg shadow-md p-6 mb-6">
			<h2 class="text-xl font-semibold dark:text-[#E8EDE8] mb-4">Actions</h2>
			<div class="space-y-4">
				<div>
					<button on:click={handleCreateTestOrder} disabled={isLoading || !testData.productId}
						class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold">
						{isLoading ? 'Processing...' : '1. Create Test Order (Simulated Payment)'}
					</button>
					{#if !testData.productId}<p class="text-sm text-red-600 mt-1">Please enter a valid product ID</p>{/if}
				</div>

				{#if orderId}
					<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
						<label class="block text-sm font-medium dark:text-[#C5D4C5] mb-1">Current Order ID:</label>
						<input type="text" bind:value={orderId} class="w-full px-3 py-2 border border-cream-300 dark:border-[#4a5552] rounded font-mono text-sm bg-white dark:bg-[#343c39] dark:text-[#E8EDE8]" />
					</div>
				{/if}

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<button on:click={() => shipmentAction('next-status')} disabled={isLoading || !orderId}
						class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
						2. Progress Status →
					</button>
					<button on:click={() => shipmentAction('simulate-delivery')} disabled={isLoading || !orderId}
						class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
						3. Simulate Delivery
					</button>
					<button on:click={() => shipmentAction('get-tracking')} disabled={isLoading || !orderId}
						class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
						4. Get Tracking
					</button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
					<button on:click={handleLoadUserOrders} disabled={isLoading}
						class="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
						5. Load User Orders
					</button>
					<button on:click={handleCleanup} disabled={isLoading}
						class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
						🗑️ Cleanup All Test Orders
					</button>
				</div>
			</div>
		</div>

		{#if orders.length > 0}
			<div class="bg-white dark:bg-[#2a3330] rounded-lg shadow-md p-6 mb-6">
				<h2 class="text-xl font-semibold dark:text-[#E8EDE8] mb-4">User Orders ({orders.length})</h2>
				<div class="space-y-3">
					{#each orders as order}
						<button class="w-full text-left border border-cream-200 dark:border-[#3f4946] rounded p-4 hover:bg-gray-50 dark:hover:bg-[#343c39] cursor-pointer"
							on:click={() => orderId = order.id}>
							<div class="flex justify-between items-start">
								<div>
									<p class="font-mono text-sm text-gray-600 dark:text-[#8A9A8A]">{order.id}</p>
									<p class="font-semibold mt-1 dark:text-[#E8EDE8]">Status: {order.status}</p>
									<p class="text-sm text-gray-600 dark:text-[#8A9A8A]">Total: {order.total} SEK</p>
									{#if order.trackingNumber}<p class="text-sm text-blue-600 dark:text-blue-400">📦 {order.trackingNumber}</p>{/if}
								</div>
								<div class="text-right">
									<p class="text-sm text-gray-600 dark:text-[#8A9A8A]">{order.paymentMethod}</p>
									<p class="text-xs text-gray-500 dark:text-[#6B7B6B]">{new Date(order.createdAt).toLocaleString()}</p>
								</div>
							</div>
							{#if order.items?.length > 0}
								<div class="mt-2 pt-2 border-t border-cream-100 dark:border-[#3f4946]">
									<p class="text-sm font-medium dark:text-[#C5D4C5]">Items:</p>
									{#each order.items as item}
										<p class="text-sm text-gray-600 dark:text-[#8A9A8A]">• {item.productName} × {item.quantity} - {item.price} SEK</p>
									{/each}
								</div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if result}
			<div class="bg-white dark:bg-[#2a3330] rounded-lg shadow-md p-6">
				<h2 class="text-xl font-semibold dark:text-[#E8EDE8] mb-4">{result.success ? '✅ Success' : '❌ Error'}</h2>
				{#if result.message}<p class="text-lg mb-4 font-medium dark:text-[#C5D4C5]">{result.message}</p>{/if}
				<pre class="bg-gray-100 dark:bg-[#343c39] dark:text-[#E8EDE8] p-4 rounded overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
			</div>
		{/if}
	</div>
</div>
