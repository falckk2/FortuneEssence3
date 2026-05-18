import { ok, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';

const AGENT_URL = process.env.ADVISOR_API_URL || 'http://127.0.0.1:8000';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const res = await fetch(`${AGENT_URL}/api/advisor/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		if (!res.ok) return serverError(`Agent responded with ${res.status}`);
		const data = await res.json();
		return ok(data);
	} catch (e) {
		return serverError(e);
	}
};
