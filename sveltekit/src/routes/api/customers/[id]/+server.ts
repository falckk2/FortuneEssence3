import type { RequestHandler } from './$types';
import { ok, unauthorized, forbidden, serverError } from '$lib/utils/api';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		return ok({
			id: params.id,
			name: 'Mock Customer',
			email: 'customer@example.com',
			phone: '+46 70 123 4567',
			createdAt: new Date().toISOString(),
			status: 'active',
			newsletter: true,
		});
	} catch (e) {
		return serverError(e);
	}
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const body = await request.json();
		return ok({ id: params.id, ...body });
	} catch (e) {
		return serverError(e);
	}
};

export const DELETE: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		return ok({ message: 'Customer deletion endpoint (requires database implementation)' });
	} catch (e) {
		return serverError(e);
	}
};
