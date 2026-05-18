import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IGDPRService } from '$lib/interfaces';

const gdprService = container.resolve<IGDPRService>(TOKENS.IGDPRService);

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const action = url.searchParams.get('action');

		switch (action) {
			case 'consent-status': return ok((await gdprService.getConsentStatus(session.user.id)).data);
			case 'data-export': return ok((await gdprService.exportUserData(session.user.id)).data);
			case 'activity-log': return ok((await gdprService.getActivityLog(session.user.id)).data);
			default: return err('Invalid action');
		}
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const { action, ...data } = await request.json();

		switch (action) {
			case 'update-consent': return ok((await gdprService.updateConsent(session.user.id, data)).data);
			case 'delete-account': return ok((await gdprService.deleteUserData(session.user.id)).data);
			default: return err('Invalid action');
		}
	} catch (e) {
		return serverError(e);
	}
};
