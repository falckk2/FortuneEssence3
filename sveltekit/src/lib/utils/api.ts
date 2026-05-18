import { json } from '@sveltejs/kit';

export function ok<T>(data: T, status = 200) {
	return json({ success: true, data }, { status });
}

export function err(message: string, status = 400) {
	return json({ success: false, error: message }, { status });
}

export function unauthorized() {
	return json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
	return json({ success: false, error: 'Forbidden' }, { status: 403 });
}

export function notFound(msg = 'Not found') {
	return json({ success: false, error: msg }, { status: 404 });
}

export function serverError(e: unknown) {
	console.error(e);
	return json({ success: false, error: String(e) }, { status: 500 });
}
