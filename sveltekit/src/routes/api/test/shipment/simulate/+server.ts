import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, unauthorized, forbidden, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IShipmentSimulationService } from '$lib/interfaces/test';

const shipmentSimulationService = container.resolve<IShipmentSimulationService>(
	TOKENS.IShipmentSimulationService
);
const orderRepository = container.resolve<any>(TOKENS.IOrderRepository);

function productionGuard() {
	if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
		return json({ success: false, error: 'Test endpoints are disabled in production' }, { status: 403 });
	}
	return null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const guard = productionGuard();
	if (guard) return guard;

	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const body = await request.json();
		const { orderId, action, status } = body;
		if (!orderId) return err('Order ID is required');

		let result;
		switch (action) {
			case 'next-status':
				result = await shipmentSimulationService.progressToNextStatus(orderId);
				break;
			case 'set-status':
				if (!status) return err('Status is required for set-status action');
				result = await shipmentSimulationService.setOrderStatus(orderId, status);
				break;
			case 'simulate-delivery':
				result = await shipmentSimulationService.simulateCompleteDelivery(orderId);
				break;
			case 'generate-tracking':
				result = await shipmentSimulationService.generateTrackingEvents(orderId);
				break;
			default:
				return err('Invalid action. Use: next-status, set-status, simulate-delivery, or generate-tracking');
		}

		if (!result.success) {
			if (result.error?.toLowerCase().includes('not found')) {
				return json({ success: false, error: 'Order not found' }, { status: 404 });
			}
			return serverError(result.error);
		}

		return ok({ testMode: true, ...result.data });
	} catch (e) {
		return serverError(e);
	}
};

export const GET: RequestHandler = async ({ url, locals }) => {
	const guard = productionGuard();
	if (guard) return guard;

	const orderId = url.searchParams.get('orderId');
	if (!orderId) return err('Order ID is required');

	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const orderResult = await orderRepository.findById(orderId);
		if (!orderResult.success || !orderResult.data) {
			return json({ success: false, error: 'Order not found' }, { status: 404 });
		}

		const order = orderResult.data;
		return ok({ orderId, currentStatus: order.status, trackingNumber: order.trackingNumber, order });
	} catch (e) {
		return serverError(e);
	}
};
