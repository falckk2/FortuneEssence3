import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IAuthService } from '$lib/interfaces';

const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token, password } = await request.json();
		if (!token || !password) return err('Missing required fields');
		if (password.length < 8) return err('Password must be at least 8 characters');
		if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password))
			return err('Password must contain uppercase, lowercase, and number');

		const result = await authService.completePasswordReset(token, password);
		if (!result.success) return err('Invalid or expired reset token', 400);
		return ok({ message: 'Password has been reset successfully' });
	} catch (e) {
		return serverError(e);
	}
};
