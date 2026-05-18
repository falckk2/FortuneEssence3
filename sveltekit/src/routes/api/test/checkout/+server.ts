import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, unauthorized, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ITestCheckoutService } from '$lib/interfaces/test';

const testCheckoutService = container.resolve<ITestCheckoutService>(TOKENS.ITestCheckoutService);

export const POST: RequestHandler = async ({ request, locals }) => {
	if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
		return json({ success: false, error: 'Test endpoints are disabled in production' }, { status: 403 });
	}

	try {
		const session = await locals.auth();
		const sessionId = request.headers.get('x-session-id');
		if (!session?.user?.id && !sessionId) return unauthorized();

		const body = await request.json();

		if (session?.user?.id && body.customerId && body.customerId !== session.user.id) {
			return json({ success: false, error: 'Customer ID mismatch' }, { status: 403 });
		}

		const result = await testCheckoutService.processTestCheckout(body);
		if (!result.success) return serverError(result.error);

		return ok({ testMode: true, ...result.data });
	} catch (e) {
		return serverError(e);
	}
};
