import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized, forbidden } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IAnalyticsService, AnalyticsRange } from '$lib/interfaces';

const analyticsService = container.resolve<IAnalyticsService>(TOKENS.IAnalyticsService);

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const range = url.searchParams.get('range') || 'month';
		if (!['week', 'month', 'year'].includes(range)) return err('Invalid range parameter');

		const result = await analyticsService.getAnalytics(range as AnalyticsRange);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
