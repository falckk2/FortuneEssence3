import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized, forbidden } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IReturnService } from '$lib/interfaces';

const returnService = container.resolve<IReturnService>(TOKENS.IReturnService);

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();
		const result = await returnService.getAllReturns();
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const body = await request.json();
		const result = await returnService.createReturn(body);
		if (!result.success) return serverError(result.error);
		return ok(result.data, 201);
	} catch (e) {
		return serverError(e);
	}
};
