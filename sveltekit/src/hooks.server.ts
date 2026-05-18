import { handle as authHandle } from './auth';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';

const adminGuard: Handle = async ({ event, resolve }) => {
	const isAdminRoute =
		event.url.pathname.startsWith('/admin') ||
		event.url.pathname.startsWith('/api/admin');

	if (isAdminRoute) {
		const session = await event.locals.auth();
		const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

		if (!isAdmin) {
			if (event.url.pathname.startsWith('/api/')) {
				return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			redirect(303, `/auth/signin?redirect=${event.url.pathname}`);
		}
	}

	return resolve(event);
};

export const handle = sequence(authHandle, adminGuard);
