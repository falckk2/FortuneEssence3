<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const session = data.session;

	interface TestConfig {
		enabled: boolean;
		environment: string;
		canToggle: boolean;
		message?: string;
	}

	let loading = true;
	let saving = false;
	let config: TestConfig | null = null;
	let error = '';
	let success = '';

	async function loadConfig() {
		loading = true; error = '';
		try {
			const res = await fetch('/api/test/config');
			const result = await res.json();
			if (result.success) config = result.data;
			else error = result.error || 'Unknown error';
		} catch (e) {
			error = `Failed to load configuration: ${e instanceof Error ? e.message : String(e)}`;
		} finally { loading = false; }
	}

	async function toggleTestMode(enabled: boolean) {
		saving = true; error = ''; success = '';
		try {
			const res = await fetch('/api/test/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled }),
			});
			const result = await res.json();
			if (result.success) {
				success = result.data?.message || 'Updated';
				if (config) config = { ...config, enabled };
			} else {
				error = result.error || 'Unknown error';
			}
		} catch (e) {
			error = `Failed to toggle test mode: ${e instanceof Error ? e.message : String(e)}`;
		} finally { saving = false; }
	}

	onMount(() => {
		if (!session?.user) { goto('/auth/signin'); return; }
		loadConfig();
	});
</script>

<div class="max-w-4xl space-y-6">
	<div>
		<h1 class="text-3xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">Test Mode Configuration</h1>
		<p class="text-forest-600 dark:text-[#C5D4C5] mt-1">Control whether test endpoints are enabled or disabled.</p>
	</div>

	{#if error}
		<div class="bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-700 rounded-xl p-4">
			<p class="text-red-800 dark:text-red-300 font-semibold">❌ Error</p>
			<p class="text-red-700 dark:text-red-400">{error}</p>
		</div>
	{/if}

	{#if success}
		<div class="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-700 rounded-xl p-4">
			<p class="text-green-800 dark:text-green-300 font-semibold">✅ Success</p>
			<p class="text-green-700 dark:text-green-400">{success}</p>
		</div>
	{/if}

	{#if loading}
		<div class="flex items-center justify-center h-96">
			<div class="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if config}
		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
			<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Current Status</h2>
			<div class="space-y-4">
				<div class="flex items-center justify-between p-4 bg-cream-50 dark:bg-[#2a3330] rounded-xl">
					<div>
						<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Test Endpoints</p>
						<p class="text-2xl font-bold">
							{#if config.enabled}
								<span class="text-green-600 dark:text-green-400">ENABLED</span>
							{:else}
								<span class="text-red-600 dark:text-red-400">DISABLED</span>
							{/if}
						</p>
					</div>
					<div class="w-16 h-16 rounded-full flex items-center justify-center {config.enabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}">
						<span class="text-3xl">{config.enabled ? '🟢' : '🔴'}</span>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="p-4 bg-cream-50 dark:bg-[#2a3330] rounded-xl">
						<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Environment</p>
						<p class="font-semibold text-forest-800 dark:text-[#E8EDE8]">{config.environment}</p>
					</div>
					<div class="p-4 bg-cream-50 dark:bg-[#2a3330] rounded-xl">
						<p class="text-sm text-forest-600 dark:text-[#8A9A8A] mb-1">Can Toggle</p>
						<p class="font-semibold text-forest-800 dark:text-[#E8EDE8]">{config.canToggle ? '✅ Yes' : '❌ No (Production)'}</p>
					</div>
				</div>
			</div>
		</div>

		{#if config.canToggle}
			<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
				<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Toggle Test Mode</h2>
				<div class="space-y-4">
					<div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
						<p class="text-sm text-yellow-800 dark:text-yellow-300">
							<strong>⚠️ Important:</strong> After changing this setting, you must restart your development server for the changes to take effect.
						</p>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<button on:click={() => toggleTestMode(true)} disabled={saving || config.enabled}
							class="p-6 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed {config.enabled ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600' : 'border-cream-300 dark:border-[#3f4946] hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}">
							<div class="text-center">
								<div class="text-4xl mb-2">🟢</div>
								<p class="font-bold text-lg mb-2 text-forest-800 dark:text-[#E8EDE8]">Enable Test Mode</p>
								<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">Allow test endpoints for simulated payments and orders</p>
							</div>
						</button>
						<button on:click={() => toggleTestMode(false)} disabled={saving || !config.enabled}
							class="p-6 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed {!config.enabled ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600' : 'border-cream-300 dark:border-[#3f4946] hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}">
							<div class="text-center">
								<div class="text-4xl mb-2">🔴</div>
								<p class="font-bold text-lg mb-2 text-forest-800 dark:text-[#E8EDE8]">Disable Test Mode</p>
								<p class="text-sm text-forest-600 dark:text-[#8A9A8A]">Block all test endpoints for security</p>
							</div>
						</button>
					</div>
				</div>
			</div>
		{/if}

		<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
			<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">What This Controls</h2>
			<div class="space-y-4">
				<div>
					<h3 class="font-semibold text-green-700 dark:text-green-400 mb-2">✅ When Enabled:</h3>
					<ul class="list-disc list-inside space-y-1 text-forest-700 dark:text-[#C5D4C5]">
						<li>Test checkout endpoint available at <code class="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/api/test/checkout</code></li>
						<li>Shipment simulation at <code class="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/api/test/shipment/simulate</code></li>
						<li>Order management at <code class="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/api/test/orders</code></li>
						<li>Test UI accessible at <code class="bg-cream-100 dark:bg-[#2a3330] px-2 py-1 rounded">/test-orders</code></li>
					</ul>
				</div>
				<div>
					<h3 class="font-semibold text-red-700 dark:text-red-400 mb-2">🔒 When Disabled:</h3>
					<ul class="list-disc list-inside space-y-1 text-forest-700 dark:text-[#C5D4C5]">
						<li>All test endpoints return 403 Forbidden</li>
						<li>Cannot create simulated orders</li>
						<li>Better security for production-like environments</li>
					</ul>
				</div>
				<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl p-4">
					<p class="text-sm text-blue-800 dark:text-blue-300">
						<strong>💡 Tip:</strong> Test endpoints are automatically enabled in development mode and disabled in production mode. This setting allows you to override the default behavior.
					</p>
				</div>
			</div>
		</div>

		{#if config.enabled}
			<div class="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
				<h2 class="text-xl font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Quick Links</h2>
				<div class="space-y-2">
					<a href="/test-orders" class="block p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors">
						<p class="font-semibold text-blue-700 dark:text-blue-300">🧪 Test Orders UI</p>
						<p class="text-sm text-blue-600 dark:text-blue-400">Create and manage test orders</p>
					</a>
					<a href="/TEST_SYSTEM_GUIDE.md" target="_blank" rel="noopener noreferrer"
						class="block p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors">
						<p class="font-semibold text-purple-700 dark:text-purple-300">📚 Test System Guide</p>
						<p class="text-sm text-purple-600 dark:text-purple-400">Complete documentation</p>
					</a>
				</div>
			</div>
		{/if}
	{/if}
</div>
