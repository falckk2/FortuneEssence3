import type { RequestHandler } from './$types';
import { ok, err, unauthorized, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';

const mockOrderTracking: Record<string, unknown> = {
	'ORD-001': {
		orderId: 'ord-abc123',
		orderNumber: 'ORD-001',
		status: 'shipped',
		trackingNumber: 'PN1234567890SE',
		carrier: 'PostNord',
		estimatedDelivery: '2024-11-18T12:00:00Z',
		items: [
			{ id: 'item-1', productName: 'Lavendelolja 10ml', quantity: 2, price: 149.0 },
			{ id: 'item-2', productName: 'Pepparmyntaolja 10ml', quantity: 1, price: 139.0 },
		],
		total: 437.0,
		shippingAddress: { street: 'Storgatan 12', city: 'Stockholm', postalCode: '11455', country: 'Sverige' },
		trackingHistory: [
			{ status: 'Paket i transit', location: 'Stockholm, Sverige', timestamp: '2024-11-16T14:30:00Z', description: 'Paketet är på väg till destinationen' },
			{ status: 'Paket sorterat', location: 'Göteborg Terminal, Sverige', timestamp: '2024-11-16T09:15:00Z', description: 'Paketet har sorterats vid Göteborg terminal' },
			{ status: 'Paket hämtat från avsändare', location: 'Malmö, Sverige', timestamp: '2024-11-15T16:45:00Z', description: 'Paketet har hämtats från avsändaren' },
			{ status: 'Fraktetikett skapad', location: 'Malmö, Sverige', timestamp: '2024-11-15T10:20:00Z', description: 'Fraktetikett har skapats och order bekräftad' },
		],
	},
};

const mockTrackingNumbers: Record<string, string> = { 'PN1234567890SE': 'ORD-001' };

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const orderId = url.searchParams.get('orderId');
		const trackingNumber = url.searchParams.get('trackingNumber');

		if (!orderId && !trackingNumber) return err('Order ID or tracking number is required');

		if (orderId && !trackingNumber) {
			const session = await locals.auth();
			if (!session?.user?.id) return unauthorized();
		}

		let orderKey: string | null = null;
		if (orderId) orderKey = orderId;
		else if (trackingNumber && mockTrackingNumbers[trackingNumber]) orderKey = mockTrackingNumbers[trackingNumber];

		if (orderKey && mockOrderTracking[orderKey]) return ok(mockOrderTracking[orderKey]);

		return json({ success: false, error: 'Order not found' }, { status: 404 });
	} catch (e) {
		return serverError(e);
	}
};
