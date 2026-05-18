import '$lib/config/di-init';
import { supabase } from '$lib/supabase';
import { ok, err, serverError } from '$lib/utils/api';
import type { RequestHandler } from './$types';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, locale = 'sv' } = await request.json();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) return err('Invalid email address');

		const { data: existing } = await supabase
			.from('newsletter_subscriptions')
			.select('*')
			.eq('email', email)
			.single();

		if (existing?.status === 'active') {
			return err(locale === 'sv' ? 'E-postadressen är redan prenumererad' : 'Email already subscribed');
		}

		const verificationToken = crypto.randomBytes(32).toString('hex');

		if (existing) {
			await supabase.from('newsletter_subscriptions').update({ status: 'pending', verification_token: verificationToken, updated_at: new Date().toISOString() }).eq('email', email);
		} else {
			await supabase.from('newsletter_subscriptions').insert({ email, status: 'pending', verification_token: verificationToken, locale });
		}

		return ok({ message: locale === 'sv' ? 'Kolla din e-post för bekräftelse' : 'Check your email for confirmation' });
	} catch (e) {
		return serverError(e);
	}
};
