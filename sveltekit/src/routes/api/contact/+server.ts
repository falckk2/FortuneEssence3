import '$lib/config/di-init';
import { container, TOKENS } from '$lib/config/di-container';
import { ok, err, serverError } from '$lib/utils/api';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IEmailService } from '$lib/interfaces/email';

const emailService = container.resolve<IEmailService>(TOKENS.IEmailService);

const contactRequests = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS = 5;

function checkRateLimit(ip: string): boolean {
	const now = Date.now();
	const recent = (contactRequests.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW);
	if (recent.length >= MAX_REQUESTS) return false;
	recent.push(now);
	contactRequests.set(ip, recent);
	return true;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const ip = request.headers.get('x-forwarded-for') || 'unknown';
		if (!checkRateLimit(ip)) return json({ success: false, error: 'Too many requests' }, { status: 429 });

		const { name, email, subject, message } = await request.json();
		if (!name || !email || !message) return err('Missing required fields');
		if (!email.includes('@')) return err('Invalid email address');
		if (message.length < 10) return err('Message too short');

		await emailService.sendContactNotification?.({ name, email, subject, message });
		return ok({ message: 'Message sent successfully' });
	} catch (e) {
		return serverError(e);
	}
};
