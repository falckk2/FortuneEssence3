import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IProductService } from '$lib/interfaces';

const productService = container.resolve<IProductService>(TOKENS.IProductService);

export const GET: RequestHandler = async () => {
	try {
		const result = await productService.getProductCategories();
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
