import type { Session } from '@auth/sveltekit';

declare global {
	namespace App {
		interface Locals {
			auth: () => Promise<Session | null>;
			session: Session | null;
		}
		interface PageData {
			session: Session | null;
		}
		interface Error {
			message: string;
			code?: string;
		}
	}
}

export {};
