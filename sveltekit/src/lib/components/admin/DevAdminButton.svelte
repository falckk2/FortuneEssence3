<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let isOpen = $state(false);
	let testModeEnabled: boolean | null = $state(null);
	let isLoading = $state(false);
	let menuRef: HTMLDivElement;

	const isDevelopment = browser && import.meta.env.DEV;

	async function checkTestModeStatus() {
		try {
			const res = await fetch('/api/test/config');
			const result = await res.json();
			if (result.success) testModeEnabled = result.data.enabled;
		} catch {}
	}

	async function toggleTestMode() {
		isLoading = true;
		try {
			const res = await fetch('/api/test/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: !testModeEnabled }),
			});
			const result = await res.json();
			if (result.success) {
				testModeEnabled = !testModeEnabled;
				alert(result.data.message + '\n\nPlease restart your server for changes to take effect.');
			} else {
				alert('Failed to toggle test mode: ' + result.error);
			}
		} catch (e) {
			alert('Error toggling test mode: ' + e);
		} finally { isLoading = false; }
	}

	function handleClickOutside(e: MouseEvent) {
		if (menuRef && !menuRef.contains(e.target as Node)) isOpen = false;
	}

	onMount(() => {
		if (isDevelopment) checkTestModeStatus();
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	});
</script>

{#if isDevelopment}
	<div class="fixed bottom-6 right-52 z-50" bind:this={menuRef}>
		{#if isOpen}
			<div class="absolute bottom-16 right-0 w-72 bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden mb-2">
				<div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
					<h3 class="font-bold text-lg">🛠️ Dev Admin Panel</h3>
					<p class="text-xs text-purple-100">Development Mode Only</p>
				</div>

				<div class="p-2">
					<button on:click={toggleTestMode} disabled={isLoading || testModeEnabled === null}
						class="w-full flex items-center justify-between p-3 rounded-lg mb-2 transition-all {testModeEnabled ? 'bg-green-50 hover:bg-green-100 border border-green-300' : 'bg-red-50 hover:bg-red-100 border border-red-300'} disabled:opacity-50 disabled:cursor-not-allowed">
						<div class="flex items-center space-x-3">
							<span class="text-2xl">{testModeEnabled ? '🟢' : '🔴'}</span>
							<div class="text-left">
								<p class="font-semibold text-sm">Test Mode</p>
								<p class="text-xs text-gray-600">
									{isLoading ? 'Toggling...' : testModeEnabled === null ? 'Loading...' : testModeEnabled ? 'Currently ON' : 'Currently OFF'}
								</p>
							</div>
						</div>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
						</svg>
					</button>

					<div class="border-t border-gray-200 my-2"></div>

					<a href="/test-orders" on:click={() => isOpen = false}
						class="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
						<span class="text-2xl">🧪</span>
						<div class="flex-1 text-left">
							<p class="font-semibold text-sm group-hover:text-blue-600">Test Orders</p>
							<p class="text-xs text-gray-600">Create & manage test orders</p>
						</div>
						<svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
						</svg>
					</a>

					<a href="/admin/test-config" on:click={() => isOpen = false}
						class="flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group">
						<span class="text-2xl">⚙️</span>
						<div class="flex-1 text-left">
							<p class="font-semibold text-sm group-hover:text-purple-600">Test Config</p>
							<p class="text-xs text-gray-600">Advanced test settings</p>
						</div>
						<svg class="w-5 h-5 text-gray-400 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
						</svg>
					</a>

					<div class="border-t border-gray-200 my-2"></div>

					<a href="/TEST_SYSTEM_GUIDE.md" target="_blank" rel="noopener noreferrer"
						class="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
						<span class="text-2xl">📚</span>
						<div class="flex-1 text-left">
							<p class="font-semibold text-sm group-hover:text-gray-700">Documentation</p>
							<p class="text-xs text-gray-600">Test system guide</p>
						</div>
						<svg class="w-5 h-5 text-gray-400 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
						</svg>
					</a>
				</div>

				<div class="bg-gray-50 px-4 py-2 text-center">
					<p class="text-xs text-gray-500">💡 Only visible in development</p>
				</div>
			</div>
		{/if}

		<button on:click={() => isOpen = !isOpen}
			class="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 {isOpen ? 'bg-purple-600 rotate-45' : 'bg-gradient-to-r from-purple-600 to-blue-600'} text-white hover:shadow-xl"
			aria-label="Open dev admin menu">
			{#if isOpen}
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			{/if}
		</button>

		{#if testModeEnabled !== null && !isOpen}
			<div class="absolute -top-1 -right-1 w-4 h-4 rounded-full {testModeEnabled ? 'bg-green-500' : 'bg-red-500'} border-2 border-white"
				title={testModeEnabled ? 'Test Mode ON' : 'Test Mode OFF'}></div>
		{/if}
	</div>
{/if}
