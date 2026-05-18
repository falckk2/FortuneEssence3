import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized, forbidden } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IProductService, IProductRepository, ProductSearchParams } from '$lib/interfaces';

const productService = container.resolve<IProductService>(TOKENS.IProductService);
const productRepository = container.resolve<IProductRepository>(TOKENS.IProductRepository);

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const params: ProductSearchParams = {
			category: url.searchParams.get('category') || undefined,
			minPrice: url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')!) : undefined,
			maxPrice: url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')!) : undefined,
			inStock: url.searchParams.get('inStock') === 'true' || undefined,
			search: url.searchParams.get('search') || undefined,
			locale: (url.searchParams.get('locale') as 'sv' | 'en') || 'sv',
		};

		const result = await productService.getProducts(params);
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
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const body = await request.json();
		const result = await productRepository.create(body);
		if (!result.success) return serverError(result.error);
		return ok(result.data, 201);
	} catch (e) {
		return serverError(e);
	}
};
