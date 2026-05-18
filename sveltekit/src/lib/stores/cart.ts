import { writable, derived } from 'svelte/store';
import type { CartItem } from '$lib/types';

interface CartState {
	items: CartItem[];
	total: number;
	isLoading: boolean;
}

function getSessionId(): string {
	if (typeof localStorage === 'undefined') return '';
	let id = localStorage.getItem('session_id');
	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem('session_id', id);
	}
	return id;
}

function createCartStore() {
	const { subscribe, set, update } = writable<CartState>({
		items: [],
		total: 0,
		isLoading: false,
	});

	async function callApi(body: object) {
		const sessionId = getSessionId();
		const res = await fetch('/api/cart', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId },
			body: JSON.stringify(body),
		});
		const data = await res.json();
		if (!data.success) throw new Error(data.error || 'Cart error');
		return data;
	}

	async function refresh() {
		const sessionId = getSessionId();
		const res = await fetch('/api/cart', { headers: { 'x-session-id': sessionId } });
		const data = await res.json();
		if (data.success && data.data) {
			update((s) => ({ ...s, items: data.data.items ?? [], total: data.data.total ?? 0 }));
		}
	}

	async function withLoading(fn: () => Promise<void>) {
		update((s) => ({ ...s, isLoading: true }));
		try {
			await fn();
		} finally {
			update((s) => ({ ...s, isLoading: false }));
		}
	}

	return {
		subscribe,
		refresh,
		addItem: (item: CartItem) =>
			withLoading(async () => {
				await callApi({ action: 'add', productId: item.productId, quantity: item.quantity });
				await refresh();
			}),
		addBundle: (bundleProductId: string, selectedProductIds: string[], quantity = 1) =>
			withLoading(async () => {
				await callApi({ action: 'add-bundle', bundleProductId, selectedProductIds, quantity });
				await refresh();
			}),
		removeItem: (productId: string, cartItemId?: string) =>
			withLoading(async () => {
				await callApi({ action: 'remove', productId, ...(cartItemId && { cartItemId }) });
				await refresh();
			}),
		updateQuantity: (productId: string, quantity: number, cartItemId?: string) =>
			withLoading(async () => {
				if (quantity <= 0) {
					await callApi({ action: 'remove', productId, ...(cartItemId && { cartItemId }) });
				} else {
					await callApi({ action: 'update', productId, quantity });
				}
				await refresh();
			}),
		clearCart: () =>
			withLoading(async () => {
				await callApi({ action: 'clear' });
				update((s) => ({ ...s, items: [], total: 0 }));
			}),
	};
}

export const cart = createCartStore();
export const cartItemCount = derived(cart, ($c) =>
	$c.items.reduce((sum, item) => sum + item.quantity, 0)
);
