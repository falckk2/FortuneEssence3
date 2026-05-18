import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError, unauthorized } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import type { ICustomerRepository } from '$lib/interfaces';

const customerRepository = container.resolve<ICustomerRepository>(TOKENS.ICustomerRepository);

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		const body = await request.json();
		const result = await customerRepository.update(session.user.id, body);
		if (!result.success) return serverError(result.error);
		return ok(result.data);
	} catch (e) {
		return serverError(e);
	}
};
