import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IProductService } from '$lib/interfaces';

const productService = container.resolve<IProductService>(TOKENS.IProductService);

export const GET: RequestHandler = async ({ url }) => {
	try {
		const query = url.searchParams.get('q');
		const locale = (url.searchParams.get('locale') as 'sv' | 'en') || 'sv';
		if (!query || query.trim().length < 2) return err('Search query must be at least 2 characters');
		const result = await productService.searchProducts(query.trim(), locale);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
