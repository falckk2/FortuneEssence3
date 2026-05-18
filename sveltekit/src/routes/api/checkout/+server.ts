import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { ICartService, IShippingService, IPaymentService, IOrderService } from '$lib/interfaces';
import type { IEmailService } from '$lib/interfaces/email';

const cartService = container.resolve<ICartService>(TOKENS.ICartService);
const shippingService = container.resolve<IShippingService>(TOKENS.IShippingService);
const paymentService = container.resolve<IPaymentService>(TOKENS.IPaymentService);
const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);
const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		const sessionId = request.headers.get('x-session-id');
		if (!session?.user?.id && !sessionId) return unauthorized();

		const body = await request.json();

		switch (body.action) {
			case 'validate-cart': {
				const cartResult = await cartService.getCart(session?.user?.id, sessionId || undefined);
				if (!cartResult.success || !cartResult.data) return serverError(cartResult.error);
				if (cartResult.data.items.length === 0) return err('Cart is empty');
				const validation = await cartService.validateCartItems(cartResult.data.id);
				return ok({ cart: cartResult.data, validation: validation.data });
			}
			case 'calculate-shipping': {
				const { address, cartId } = body;
				const result = await shippingService.calculateShipping(cartId, address);
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			case 'create-payment-intent': {
				const { amount, currency = 'sek', orderId } = body;
				const result = await paymentService.createPaymentIntent({ amount, currency, orderId });
				if (!result.success) return serverError(result.error);
				return ok(result.data);
			}
			case 'process-payment': {
				const result = await paymentService.processPayment(body);
				if (!result.success) return serverError(result.error);
				if (result.data?.orderId) {
					const order = await orderService.getOrder(result.data.orderId);
					if (order.success && order.data) {
						await emailService.sendOrderConfirmation(order.data.customerId, order.data as never, 'sv');
					}
				}
				return ok(result.data);
			}
			default:
				return err('Invalid action');
		}
	} catch (e) {
		return serverError(e);
	}
};
