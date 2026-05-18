import { writable } from 'svelte/store';

interface Message {
	role: 'user' | 'assistant';
	content: string;
}

interface AdvisorState {
	isOpen: boolean;
	messages: Message[];
	isLoading: boolean;
	sessionId: string;
	selectedProducts: string[];
}

function createAdvisorStore() {
	const { subscribe, update } = writable<AdvisorState>({
		isOpen: false,
		messages: [],
		isLoading: false,
		sessionId: crypto.randomUUID(),
		selectedProducts: [],
	});

	return {
		subscribe,
		open: () => update((s) => ({ ...s, isOpen: true })),
		close: () => update((s) => ({ ...s, isOpen: false })),
		toggle: () => update((s) => ({ ...s, isOpen: !s.isOpen })),
		clearMessages: () => update((s) => ({ ...s, messages: [], sessionId: crypto.randomUUID() })),
		sendMessage: async (content: string) => {
			update((s) => ({
				...s,
				isLoading: true,
				messages: [...s.messages, { role: 'user', content }],
			}));

			try {
				let sessionId = '';
				let existingMessages: Message[] = [];

				const unsubscribe = subscribe((s) => {
					sessionId = s.sessionId;
					existingMessages = s.messages;
				});
				unsubscribe();

				const res = await fetch('/api/advisor/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ message: content, sessionId, history: existingMessages }),
				});

				const data = await res.json();
				const reply = data.reply || data.message || 'Sorry, I could not process that.';

				update((s) => ({
					...s,
					isLoading: false,
					messages: [...s.messages, { role: 'assistant', content: reply }],
				}));
			} catch {
				update((s) => ({
					...s,
					isLoading: false,
					messages: [
						...s.messages,
						{ role: 'assistant', content: 'Something went wrong. Please try again.' },
					],
				}));
			}
		},
	};
}

export const advisor = createAdvisorStore();
