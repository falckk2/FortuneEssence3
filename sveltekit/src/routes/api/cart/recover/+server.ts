import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ICartService } from '$lib/interfaces';

const cartService = container.resolve<ICartService>(TOKENS.ICartService);

export const GET: RequestHandler = async ({ url }) => {
	try {
		const recoveryToken = url.searchParams.get('token');
		if (!recoveryToken) return err('Recovery token is required');

		const result = await cartService.recoverAbandonedCart(recoveryToken);

		if (!result.success || !result.data) {
			const isExpired =
				result.error === 'Invalid or expired recovery link' ||
				result.error === 'Recovery link has expired';
			return json(
				{ success: false, error: isExpired ? result.error : 'Failed to recover cart' },
				{ status: isExpired ? 404 : 500 }
			);
		}

		const { cartId, items, total, email } = result.data;
		return ok({ cartId, items, total, email, message: 'Cart recovered successfully' });
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { token: recoveryToken } = body;
		if (!recoveryToken) return err('Recovery token is required');

		const result = await cartService.recoverAbandonedCart(recoveryToken);

		if (!result.success || !result.data) {
			const isExpired =
				result.error === 'Invalid or expired recovery link' ||
				result.error === 'Recovery link has expired';
			return json(
				{ success: false, error: isExpired ? result.error : 'Failed to recover cart' },
				{ status: isExpired ? 404 : 500 }
			);
		}

		const { cartId, items, total, email } = result.data;
		return ok({ cartId, items, total, email, message: 'Cart recovered successfully' });
	} catch (e) {
		return serverError(e);
	}
};
