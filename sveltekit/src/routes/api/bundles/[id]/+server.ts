import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError, notFound } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IBundleService } from '$lib/interfaces';

const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await bundleService.getBundle(params.id);
		if (!result.success || !result.data) return notFound('Bundle not found');
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
