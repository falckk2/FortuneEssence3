import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IBundleService } from '$lib/interfaces';

const bundleService = container.resolve<IBundleService>(TOKENS.IBundleService);

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await bundleService.getEligibleProducts(params.id);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
