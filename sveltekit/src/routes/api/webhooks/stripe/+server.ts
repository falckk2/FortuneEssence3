import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IOrderService } from '$lib/interfaces';
import type { IEmailService } from '$lib/interfaces/email';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
	if (!_stripe) {
		const key = process.env.STRIPE_SECRET_KEY;
		if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
		_stripe = new Stripe(key, { apiVersion: '2025-08-27.basil' });
	}
	return _stripe;
}

const orderService = container.resolve<IOrderService>(TOKENS.IOrderService);
const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.text();
		const signature = request.headers.get('stripe-signature');
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

		if (!signature) return json({ success: false, error: 'Missing signature' }, { status: 400 });

		let event: Stripe.Event;
		try {
			event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
		} catch {
			return json({ success: false, error: 'Invalid signature' }, { status: 400 });
		}

		switch (event.type) {
			case 'payment_intent.succeeded': {
				const pi = event.data.object as Stripe.PaymentIntent;
				const orderId = pi.metadata?.orderId;
				if (orderId) {
					await orderService.updateOrderStatus(orderId, 'confirmed');
					const order = await orderService.getOrder(orderId);
					if (order.success && order.data) {
						await emailService.sendOrderConfirmation(order.data.customerId, order.data as never, 'sv');
					}
				}
				break;
			}
			case 'payment_intent.payment_failed': {
				const pi = event.data.object as Stripe.PaymentIntent;
				const orderId = pi.metadata?.orderId;
				if (orderId) await orderService.updateOrderStatus(orderId, 'cancelled');
				break;
			}
		}

		return json({ received: true });
	} catch (e) {
		console.error('Stripe webhook error:', e);
		return json({ success: false, error: String(e) }, { status: 500 });
	}
};
