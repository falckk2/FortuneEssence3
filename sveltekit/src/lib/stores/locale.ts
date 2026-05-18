import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type Locale = 'sv' | 'en';

function createLocaleStore() {
	const getInitial = (): Locale => {
		if (!browser) return 'sv';
		const stored = localStorage.getItem('locale') as Locale | null;
		if (stored === 'sv' || stored === 'en') return stored;
		return navigator.language.startsWith('sv') ? 'sv' : 'en';
	};

	const { subscribe, set } = writable<Locale>(getInitial());

	return {
		subscribe,
		set: (locale: Locale) => {
			if (browser) localStorage.setItem('locale', locale);
			set(locale);
		},
		toggle: () => {
			const current = browser ? (localStorage.getItem('locale') as Locale) || 'sv' : 'sv';
			const next: Locale = current === 'sv' ? 'en' : 'sv';
			if (browser) localStorage.setItem('locale', next);
			set(next);
		},
		init: () => {
			set(getInitial());
		},
	};
}

export const locale = createLocaleStore();
export const isSv = derived(locale, ($l) => $l === 'sv');
