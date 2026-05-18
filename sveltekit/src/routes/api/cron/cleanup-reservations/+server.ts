import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IInventoryService } from '$lib/interfaces';

export const GET: RequestHandler = async ({ request }) => {
	const cronSecret = process.env.CRON_SECRET;
	const authHeader = request.headers.get('authorization');
	if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const inventoryService = container.resolve<IInventoryService>(TOKENS.IInventoryService);
		const result = await inventoryService.cleanupExpiredReservations();
		if (!result.success) return serverError(result.error);
		return ok({
			message: `Cleaned up ${result.data?.expiredCount || 0} expired reservations`,
			expiredCount: result.data?.expiredCount || 0,
			timestamp: new Date().toISOString(),
		});
	} catch (e) {
		return serverError(e);
	}
};
