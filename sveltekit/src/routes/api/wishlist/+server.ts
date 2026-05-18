import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IWishlistRepository } from '$lib/repositories/wishlist/WishlistRepository';

const wishlistRepository = container.resolve<IWishlistRepository>(TOKENS.IWishlistRepository);

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const result = await wishlistRepository.findByCustomerId(session.user.id);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const { action, productId } = await request.json();
		if (!action || !productId) return err('Missing required fields');

		switch (action) {
			case 'add': {
				const result = await wishlistRepository.add(session.user.id, productId);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			case 'remove': {
				const result = await wishlistRepository.remove(session.user.id, productId);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			case 'clear': {
				const result = await wishlistRepository.clearByCustomerId(session.user.id);
				if (!result.success) return serverError(result.error);
				return ok(null);
			}
			default:
				return err('Invalid action');
		}
	} catch (e) {
		return serverError(e);
	}
};
