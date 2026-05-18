import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError, unauthorized, forbidden } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IBundleService } from '$lib/interfaces';

const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);

export const GET: RequestHandler = async () => {
	try {
		const result = await bundleService.getBundles();
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
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();
		const body = await request.json();
		const result = await bundleService.createBundle(body);
		if (!result.success) return serverError(result.error);
		return ok(result.data, 201);
	} catch (e) {
		return serverError(e);
	}
};
