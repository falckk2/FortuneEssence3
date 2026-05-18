import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized, forbidden, notFound } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IOrderService } from '$lib/interfaces';
import type { OrderStatus } from '$lib/types';

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const action = url.searchParams.get('action');

		if (action === 'track-by-order') {
			const orderNumber = url.searchParams.get('orderNumber');
			if (!orderNumber) return err('Order number is required');
			const result = await orderService.getOrder(orderNumber);
			if (!result.success || !result.data) return notFound('Order not found');
			const o = result.data;
			return ok({ id: o.id, status: o.status, total: o.total, createdAt: o.createdAt, trackingNumber: o.trackingNumber });
		}

		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const userId = session.user.id;
		const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;

		switch (action) {
			case 'user-orders': {
				const result = await orderService.getUserOrders(userId);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			case 'statistics': {
				const result = await orderService.getOrderStatistics(userId);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			case 'recent': {
				if (!isAdmin) return forbidden();
				const days = parseInt(url.searchParams.get('days') || '30');
				const limit = parseInt(url.searchParams.get('limit') || '50');
				const result = await orderService.getRecentOrders(days, limit);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			default:
				return err('Invalid action');
		}
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const body = await request.json();
		const { action } = body;

		switch (action) {
			case 'create': {
				const { items, shippingAddress, billingAddress, paymentMethod, shippingRateId } = body;
				if (!items || !shippingAddress || !billingAddress || !paymentMethod || !shippingRateId)
					return err('Missing required order data');
				const result = await orderService.createOrder({ customerId: session.user.id, items, shippingAddress, billingAddress, paymentMethod, shippingRateId });
				if (!result.success) return serverError(result.error);
				return ok(result.data, 201);
			}
			case 'cancel': {
				const orderResult = await orderService.getOrder(body.orderId);
				if (!orderResult.success || !orderResult.data) return notFound('Order not found');
				if (orderResult.data.customerId !== session.user.id) return forbidden();
				const result = await orderService.cancelOrder(body.orderId);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			case 'track': {
				const result = await orderService.trackOrder(body.trackingNumber);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			default:
				return err('Invalid action');
		}
	} catch (e) {
		return serverError(e);
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const { orderId, status } = await request.json();
		if (!orderId || !status) return err('Order ID and status are required');

		const orderResult = await orderService.getOrder(orderId);
		if (!orderResult.success || !orderResult.data) return notFound('Order not found');
		if (orderResult.data.customerId !== session.user.id) return forbidden();
		if (!['cancelled'].includes(status)) return forbidden();

		const result = await orderService.updateOrderStatus(orderId, status as OrderStatus);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
