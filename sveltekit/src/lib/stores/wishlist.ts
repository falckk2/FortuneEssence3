import { writable, derived } from 'svelte/store';

interface WishlistItem {
	productId: string;
	addedAt: Date;
}

interface WishlistState {
	items: WishlistItem[];
	isLoading: boolean;
	isAuthenticated: boolean;
}

function createWishlistStore() {
	const { subscribe, set, update } = writable<WishlistState>({
		items: [],
		isLoading: false,
		isAuthenticated: false,
	});

	async function callApi(body: object) {
		const res = await fetch('/api/wishlist', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		const data = await res.json();
		if (!data.success) throw new Error(data.error || 'Wishlist error');
		return data;
	}

	async function refresh() {
		const res = await fetch('/api/wishlist');
		const data = await res.json();
		if (data.success && data.data) {
			update((s) => ({
				...s,
				items: data.data.map((item: { productId: string; createdAt: string }) => ({
					productId: item.productId,
					addedAt: new Date(item.createdAt),
				})),
			}));
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
		setAuthenticated: (isAuth: boolean) => {
			update((s) => ({ ...s, isAuthenticated: isAuth, items: isAuth ? s.items : [] }));
			if (isAuth) refresh();
		},
		addItem: (productId: string) =>
			withLoading(async () => {
				await callApi({ action: 'add', productId });
				await refresh();
			}),
		removeItem: (productId: string) =>
			withLoading(async () => {
				await callApi({ action: 'remove', productId });
				await refresh();
			}),
		clearWishlist: () =>
			withLoading(async () => {
				await callApi({ action: 'clear' });
				update((s) => ({ ...s, items: [] }));
			}),
	};
}

export const wishlist = createWishlistStore();
export const wishlistCount = derived(wishlist, ($w) => $w.items.length);
export const isInWishlist = (productId: string) =>
	derived(wishlist, ($w) => $w.items.some((i) => i.productId === productId));
