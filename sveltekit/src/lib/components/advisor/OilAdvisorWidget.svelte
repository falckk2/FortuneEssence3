<script lang="ts">
	import { MessageCircle, X, Send } from 'lucide-svelte';
	import { advisor } from '$lib/stores/advisor';
	import { locale } from '$lib/stores/locale';

	$: isSv = $locale === 'sv';
	let inputValue = '';

	async function sendMessage() {
		const msg = inputValue.trim();
		if (!msg || $advisor.isLoading) return;
		inputValue = '';
		await advisor.sendMessage(msg);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<!-- Toggle button -->
<button
	on:click={() => advisor.toggle()}
	class="fixed bottom-6 right-6 z-40 w-14 h-14 bg-sage-600 hover:bg-sage-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
	aria-label="Open oil advisor"
>
	<MessageCircle class="h-6 w-6" />
</button>

<!-- Chat window -->
{#if $advisor.isOpen}
	<div class="fixed bottom-24 right-6 z-40 w-80 h-[480px] bg-white dark:bg-[#242a28] rounded-2xl shadow-2xl flex flex-col border border-sage-200 dark:border-[#3f4946]">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-sage-200 dark:border-[#3f4946] bg-sage-50 dark:bg-[#2a3330] rounded-t-2xl">
			<div>
				<h3 class="font-semibold text-forest-800 dark:text-[#E8EDE8] text-sm">
					{isSv ? 'Oljekonsult' : 'Oil Advisor'}
				</h3>
				<p class="text-xs text-forest-500 dark:text-[#8A9A8A]">
					{isSv ? 'Hitta rätt olja för dig' : 'Find the right oil for you'}
				</p>
			</div>
			<button
				on:click={() => advisor.close()}
				class="p-1 text-forest-500 hover:text-forest-800 dark:text-[#8A9A8A] dark:hover:text-[#E8EDE8]"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<!-- Messages -->
		<div class="flex-1 overflow-y-auto p-4 space-y-3">
			{#if $advisor.messages.length === 0}
				<p class="text-sm text-center text-forest-400 dark:text-[#6B7B6B] py-4">
					{isSv ? 'Berätta vad du letar efter...' : 'Tell me what you\'re looking for...'}
				</p>
			{/if}
			{#each $advisor.messages as message}
				<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
					<div
						class="max-w-[85%] px-3 py-2 rounded-lg text-sm {message.role === 'user'
							? 'bg-sage-600 text-white'
							: 'bg-cream-100 dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8]'}"
					>
						{message.content}
					</div>
				</div>
			{/each}
			{#if $advisor.isLoading}
				<div class="flex justify-start">
					<div class="bg-cream-100 dark:bg-[#2a3330] px-3 py-2 rounded-lg text-sm text-forest-500 dark:text-[#8A9A8A]">
						<span class="animate-pulse">...</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Input -->
		<div class="p-3 border-t border-sage-200 dark:border-[#3f4946]">
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={inputValue}
					on:keydown={handleKeydown}
					placeholder={isSv ? 'Skriv ett meddelande...' : 'Type a message...'}
					class="flex-1 text-sm px-3 py-2 border border-sage-300 dark:border-[#3f4946] rounded-lg bg-white dark:bg-[#1a1f1e] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] focus:outline-none focus:ring-2 focus:ring-sage-500"
					disabled={$advisor.isLoading}
				/>
				<button
					on:click={sendMessage}
					disabled={$advisor.isLoading || !inputValue.trim()}
					class="p-2 bg-sage-600 hover:bg-sage-700 disabled:opacity-50 text-white rounded-lg transition-colors"
				>
					<Send class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>
{/if}
