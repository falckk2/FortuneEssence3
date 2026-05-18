import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { IAuthService } from '$lib/interfaces';
import { signUpSchema } from '$lib/utils/validation';

const authService = container.resolve<IAuthService>(TOKENS.IAuthService);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validation = signUpSchema.safeParse(body);
		if (!validation.success) return err(validation.error.issues.map((i) => i.message).join(', '));

		const result = await authService.signUp(validation.data);
		if (!result.success || !result.data) return serverError(result.error);

		return ok({ id: result.data.id, email: result.data.email, firstName: result.data.firstName, lastName: result.data.lastName }, 201);
	} catch (e) {
		return serverError(e);
	}
};
