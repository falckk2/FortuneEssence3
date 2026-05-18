import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError, unauthorized, forbidden, notFound } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IProductService, IProductRepository } from '$lib/interfaces';

const productService = container.resolve<IProductService>(TOKENS.IProductService);
const productRepository = container.resolve<IProductRepository>(TOKENS.IProductRepository);

export const GET: RequestHandler = async ({ params }) => {
	try {
		const result = await productService.getProduct(params.id);
		if (!result.success || !result.data) return notFound('Product not found');
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();
		const body = await request.json();
		const result = await productRepository.update(params.id, body);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();
		const result = await productRepository.delete(params.id);
		if (!result.success) return serverError(result.error);
		return ok(null);
	} catch (e) {
		return serverError(e);
	}
};
