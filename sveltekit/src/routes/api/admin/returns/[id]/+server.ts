import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError, unauthorized, forbidden } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IReturnService } from '$lib/interfaces';

const returnService = container.resolve<IReturnService>(TOKENS.IReturnService);

const guard = async (locals: App.Locals) => {
	const session = await locals.auth();
	if (!session?.user?.id) return { error: unauthorized() };
	if (!(session.user as { isAdmin?: boolean }).isAdmin) return { error: forbidden() };
	return { session };
};

export const GET: RequestHandler = async ({ params, locals }) => {
	const { error } = await guard(locals);
	if (error) return error;
	try {
		const result = await returnService.getReturn(params.id);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	const { error } = await guard(locals);
	if (error) return error;
	try {
		const body = await request.json();
		const result = await returnService.updateReturn(params.id, body);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
