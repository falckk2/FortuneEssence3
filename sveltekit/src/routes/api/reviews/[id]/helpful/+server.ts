import type { RequestHandler } from './$types';
import { ok, serverError } from '$lib/utils/api';

export const POST: RequestHandler = async () => {
	try {
		return ok({ message: 'Review marked as helpful (requires database implementation)' });
	} catch (e) {
		return serverError(e);
	}
};
