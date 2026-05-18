import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IShippingService } from '$lib/interfaces';
import type { CartItem } from '$lib/types';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { items, country, postalCode, orderValue } = body;

		if (!items || !Array.isArray(items) || items.length === 0) return err('Cart items are required');
		if (!country) return err('Country is required');

		const result = await shippingService.getAllShippingOptions(
			items as CartItem[],
			country,
			postalCode,
			orderValue
		);

		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
