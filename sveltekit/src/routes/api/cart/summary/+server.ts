import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { ICartService } from '$lib/interfaces';

const cartService = container.resolve<ICartService>(TOKENS.ICartService);

export const GET: RequestHandler = async ({ url, request, locals }) => {
	try {
		const session = await locals.auth();
		const sessionId = request.headers.get('x-session-id');
		const cartId = url.searchParams.get('cartId');

		if (!cartId && !session?.user?.id && !sessionId) return err('Cart ID or session required');

		let targetCartId = cartId;

		if (!targetCartId) {
			const cartResult = await cartService.getCart(session?.user?.id, sessionId || undefined);
			if (!cartResult.success || !cartResult.data) return serverError(cartResult.error);
			targetCartId = cartResult.data.id;
		}

		const result = await cartService.getCartSummary(targetCartId);
		if (!result.success) return serverError(result.error);

		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
