import { writable } from 'svelte/store';

interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
}

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);
	let nextId = 0;

	function add(message: string, type: Toast['type'] = 'info', duration = 3500) {
		const id = nextId++;
		update(toasts => [...toasts, { id, message, type }]);
		setTimeout(() => remove(id), duration);
	}

	function remove(id: number) {
		update(toasts => toasts.filter(t => t.id !== id));
	}

	return {
		subscribe,
		success: (msg: string) => add(msg, 'success'),
		error: (msg: string) => add(msg, 'error'),
		info: (msg: string) => add(msg, 'info'),
		remove,
	};
}

export const toast = createToastStore();
