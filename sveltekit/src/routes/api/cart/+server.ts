import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { ICartService } from '$lib/interfaces';

const cartService = container.resolve<ICartService>(TOKENS.ICartService);

export const GET: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		const sessionId = request.headers.get('x-session-id');

		if (!session?.user?.id && !sessionId) return unauthorized();

		const result = await cartService.getCart(session?.user?.id, sessionId || undefined);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		const sessionId = request.headers.get('x-session-id') || crypto.randomUUID();
		const body = await request.json();
		const { action, productId, quantity, cartId, cartItemId } = body;

		let targetCartId = cartId;
		if (!targetCartId) {
			const cartResult = await cartService.getCart(session?.user?.id, sessionId);
			if (!cartResult.success || !cartResult.data) return serverError(cartResult.error);
			targetCartId = cartResult.data.id;
		}

		let result;
		switch (action) {
			case 'add':
				if (!productId || !quantity) return err('Product ID and quantity are required');
				result = await cartService.addItem(targetCartId, { productId, quantity, price: 0 });
				break;
			case 'add-bundle':
				if (!body.bundleProductId || !body.selectedProductIds) return err('Bundle data required');
				result = await cartService.addBundleToCart(targetCartId, body.bundleProductId, body.selectedProductIds, body.quantity || 1);
				break;
			case 'remove':
				if (!productId) return err('Product ID is required');
				result = await cartService.removeItem(targetCartId, productId, cartItemId);
				break;
			case 'update':
				if (!productId || quantity === undefined) return err('Product ID and quantity are required');
				result = await cartService.updateQuantity(targetCartId, productId, quantity);
				break;
			case 'clear':
				result = await cartService.clearCart(targetCartId);
				if (result.success) return ok({ message: 'Cart cleared' });
				break;
			case 'validate':
				return ok((await cartService.validateCartItems(targetCartId)).data);
			case 'sync-prices':
				result = await cartService.syncCartPrices(targetCartId);
				break;
			case 'merge':
				if (!session?.user?.id) return unauthorized();
				result = await cartService.mergeGuestCart(sessionId, session.user.id);
				break;
			default:
				return err('Invalid action');
		}

		if (!result?.success) return serverError(result?.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
