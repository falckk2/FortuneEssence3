import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, unauthorized, forbidden, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

function productionGuard() {
	if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ENDPOINTS !== 'true') {
		return json({ success: false, error: 'Test endpoints are disabled in production' }, { status: 403 });
	}
	return null;
}

export const GET: RequestHandler = async ({ url, locals }) => {
	const guard = productionGuard();
	if (guard) return guard;

	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const action = url.searchParams.get('action');
		const orderId = url.searchParams.get('orderId');
		const userId = url.searchParams.get('userId') || session.user.id;
		const orderRepository = container.resolve<any>(TOKENS.IOrderRepository);

		switch (action) {
			case 'get-order': {
				if (!orderId) return err('Order ID is required');
				const result = await orderRepository.findById(orderId);
				if (!result.success) return json({ success: false, error: 'Order not found' }, { status: 404 });
				return ok({ testMode: true, order: result.data });
			}
			case 'list-user-orders': {
				if (!userId) return err('User ID is required');
				const result = await orderRepository.findByCustomerId(userId);
				if (!result.success) return serverError(result.error);
				const orders = result.data || [];
				return ok({ testMode: true, userId, orderCount: orders.length, orders: orders.map((o: any) => ({ id: o.id, status: o.status, total: o.total, paymentMethod: o.paymentMethod, trackingNumber: o.trackingNumber, createdAt: o.createdAt, items: o.items })) });
			}
			case 'list-all-test-orders': {
				const result = await orderRepository.getRecentOrders(30, 100);
				if (!result.success) return serverError(result.error);
				const orders = result.data || [];
				const testOrders = orders.filter((o: any) => o.paymentMethod?.includes('_test') || o.paymentId?.includes('test_payment'));
				return ok({ testMode: true, totalOrders: orders.length, testOrders: testOrders.length, orders: testOrders.map((o: any) => ({ id: o.id, customerId: o.customerId, status: o.status, total: o.total, paymentMethod: o.paymentMethod, paymentId: o.paymentId, trackingNumber: o.trackingNumber, createdAt: o.createdAt })) });
			}
			case 'order-statistics': {
				const result = await orderRepository.getOrderStatistics(userId);
				if (!result.success) return serverError(result.error);
				return ok({ testMode: true, userId: userId || 'all', statistics: result.data });
			}
			default:
				return err('Invalid action. Use: get-order, list-user-orders, list-all-test-orders, or order-statistics');
		}
	} catch (e) {
		return serverError(e);
	}
};

export const DELETE: RequestHandler = async ({ url, locals }) => {
	const guard = productionGuard();
	if (guard) return guard;

	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const action = url.searchParams.get('action');
		const orderRepository = container.resolve<any>(TOKENS.IOrderRepository);

		switch (action) {
			case 'delete-order': {
				const orderId = url.searchParams.get('orderId');
				if (!orderId) return err('Order ID is required');
				const result = await orderRepository.delete(orderId);
				if (!result.success) return serverError(result.error);
				return ok({ testMode: true, orderId });
			}
			case 'cleanup-test-orders': {
				const allResult = await orderRepository.getRecentOrders(30, 1000);
				if (!allResult.success) return serverError(allResult.error);
				const testOrders = (allResult.data || []).filter((o: any) => o.paymentMethod?.includes('_test') || o.paymentId?.includes('test_payment'));
				const deleted: string[] = [];
				const failed: { orderId: string }[] = [];
				for (const order of testOrders) {
					const r = await orderRepository.delete(order.id);
					if (r.success) deleted.push(order.id);
					else failed.push({ orderId: order.id });
				}
				return ok({ testMode: true, totalTestOrders: testOrders.length, deleted: deleted.length, failed: failed.length, deletedOrderIds: deleted, failedDeletions: failed });
			}
			default:
				return err('Invalid action. Use: delete-order or cleanup-test-orders');
		}
	} catch (e) {
		return serverError(e);
	}
};
