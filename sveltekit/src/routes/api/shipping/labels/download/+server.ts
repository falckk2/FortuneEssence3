import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { err, unauthorized, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IShippingService } from '$lib/interfaces';
import fs from 'fs/promises';

const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();

		const orderId = url.searchParams.get('orderId');
		if (!orderId) return err('Order ID is required');

		const labelResult = await shippingService.getShippingLabel(orderId);
		if (!labelResult.success || !labelResult.data) {
			return json({ success: false, error: 'Shipping label not found' }, { status: 404 });
		}

		const label = labelResult.data;

		try {
			const pdfBuffer = await fs.readFile(label.labelPdfUrl);
			return new Response(new Uint8Array(pdfBuffer), {
				status: 200,
				headers: {
					'Content-Type': 'application/pdf',
					'Content-Disposition': `attachment; filename="shipping-label-${label.trackingNumber}.pdf"`,
				},
			});
		} catch {
			return json({ success: false, error: 'PDF file not found' }, { status: 404 });
		}
	} catch (e) {
		return serverError(e);
	}
};
