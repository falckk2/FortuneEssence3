import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError, unauthorized, forbidden, notFound } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IOrderService } from '$lib/interfaces';
import type { OrderStatus } from '$lib/types';

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const result = await orderService.getOrder(params.id);
		if (!result.success || !result.data) return notFound('Order not found');
		const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;
		if (!isAdmin && result.data.customerId !== session.user.id) return forbidden();
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin;
		const { status } = await request.json();
		if (!isAdmin) return forbidden();
		const result = await orderService.updateOrderStatus(params.id, status as OrderStatus);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
