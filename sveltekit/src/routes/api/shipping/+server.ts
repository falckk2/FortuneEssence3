import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IShippingService } from '$lib/interfaces';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

export const GET: RequestHandler = async ({ url }) => {
	try {
		const country = url.searchParams.get('country') || 'SE';
		const result = await shippingService.getShippingRates(country);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const result = await shippingService.calculateShipping(body.cartId, body.address);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
