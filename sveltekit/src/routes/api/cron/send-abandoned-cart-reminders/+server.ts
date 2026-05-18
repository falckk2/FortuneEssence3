import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { ICartService, IEmailService, IProductService } from '$lib/interfaces';
import type { CartItem } from '$lib/types';

const cartService = container.resolve<ICartService>(TOKENS.ICartService);
const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);
const productService = container.resolve<IProductService>(TOKENS.IProductService);

export const GET: RequestHandler = async ({ request }) => {
	const cronSecret = process.env.CRON_SECRET;
	const authHeader = request.headers.get('authorization');
	if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const abandonedCartsResult = await cartService.getAbandonedCartsForReminder(1, 3);
		if (!abandonedCartsResult.success || !abandonedCartsResult.data) {
			return serverError(abandonedCartsResult.error);
		}

		const abandonedCarts = abandonedCartsResult.data;
		if (abandonedCarts.length === 0) return ok({ message: 'No abandoned carts', remindersSent: 0 });

		let remindersSent = 0;
		const errors: string[] = [];

		for (const cart of abandonedCarts) {
			try {
				const enrichedItems = await Promise.all(
					(cart.items as CartItem[]).map(async (item) => {
						const productResult = await productService.getProduct(item.productId);
						return {
							name: productResult.success && productResult.data ? productResult.data.name : `Product ${item.productId}`,
							quantity: item.quantity,
							price: item.price,
						};
					})
				);

				const emailResult = await emailService.sendAbandonedCartRecovery(cart.email, { items: enrichedItems, total: cart.total, recoveryToken: cart.recoveryToken }, 'sv');
				if (!emailResult.success) { errors.push(`Failed: ${cart.email}`); continue; }

				await cartService.markCartReminded(cart.id);
				remindersSent++;
			} catch (e) {
				errors.push(`Error: ${cart.cartId}`);
			}
		}

		return ok({ message: `Sent ${remindersSent} reminders`, remindersSent, errors });
	} catch (e) {
		return serverError(e);
	}
};
