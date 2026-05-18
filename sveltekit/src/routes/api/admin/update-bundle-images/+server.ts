import { ok, unauthorized, forbidden, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSupabaseServer } from '$lib/supabase-server';

export const POST: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const supabase = getSupabaseServer();

		const updates = [
			{ sku: 'BUNDLE-2PACK', image: '/images/bundles/duo-pack.svg', name: 'Duo Pack' },
			{ sku: 'BUNDLE-3PACK', image: '/images/bundles/trio-pack.svg', name: 'Trio Pack' },
			{ sku: 'BUNDLE-4PACK', image: '/images/bundles/mini-kit.svg', name: 'Mini Kit' },
		];

		for (const { sku, image, name } of updates) {
			const { data, error } = await supabase
				.from('products')
				.update({ images: [image] })
				.eq('sku', sku)
				.select('sku');

			if (error) throw error;
			if (!data || data.length === 0) {
				return json({ success: false, error: `Bundle SKU not found: ${name}` }, { status: 404 });
			}
		}

		const { data: bundles, error: verifyError } = await supabase
			.from('products')
			.select('name, sku, images')
			.eq('category', 'bundles')
			.order('price');

		if (verifyError) throw verifyError;

		return ok({ message: 'Bundle images updated successfully', bundles });
	} catch (e) {
		return serverError(e);
	}
};
