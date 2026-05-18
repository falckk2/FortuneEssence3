import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IAuthService } from '$lib/interfaces';

const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();
		if (!email?.includes('@')) return err('Invalid email address');
		await authService.resetPassword(email);
		return ok({ message: 'If an account exists with this email, a reset link has been sent' });
	} catch (e) {
		return serverError(e);
	}
};
