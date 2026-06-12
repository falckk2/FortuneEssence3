import { ok, err, unauthorized, forbidden, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_LOCAL_PATH = join(process.cwd(), '.env.local');

function getTestModeStatus(): boolean {
	if (process.env.ENABLE_TEST_ENDPOINTS === 'true') return true;
	if (process.env.NODE_ENV === 'development') return true;
	return false;
}

function updateEnvFile(enabled: boolean): boolean {
	try {
		const content = existsSync(ENV_LOCAL_PATH) ? readFileSync(ENV_LOCAL_PATH, 'utf-8') : '';
		const lines = content.split('\n').filter(l => !l.trim().startsWith('ENABLE_TEST_ENDPOINTS'));
		lines.push(`ENABLE_TEST_ENDPOINTS=${enabled ? 'true' : 'false'}`);
		writeFileSync(ENV_LOCAL_PATH, lines.join('\n'));
		return true;
	} catch {
		return false;
	}
}

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();

		const isEnabled = getTestModeStatus();
		return ok({
			enabled: isEnabled,
			environment: process.env.NODE_ENV,
			canToggle: process.env.NODE_ENV !== 'production',
			message: isEnabled ? 'Test endpoints are currently ENABLED' : 'Test endpoints are currently DISABLED',
		});
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		if (process.env.NODE_ENV === 'production') {
			return json(
				{ success: false, error: 'Cannot toggle test endpoints in production environment. Update environment variables manually.' },
				{ status: 403 }
			);
		}

		const body = await request.json();
		if (typeof body.enabled !== 'boolean') return err('enabled must be a boolean value');

		const updated = updateEnvFile(body.enabled);
		if (!updated) return serverError('Failed to update .env.local');

		return ok({
			enabled: body.enabled,
			message: body.enabled
				? 'Test endpoints ENABLED - Restart server for changes to take effect'
				: 'Test endpoints DISABLED - Restart server for changes to take effect',
			requiresRestart: true,
		});
	} catch (e) {
		return serverError(e);
	}
};
