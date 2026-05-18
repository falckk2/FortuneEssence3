import type { RequestHandler } from './$types';
import { ok, err, unauthorized, forbidden, serverError } from '$lib/utils/api';

const mockCustomers = [
	{ id: 'cust-001', name: 'Anna Andersson', email: 'anna.andersson@example.com', phone: '+46 70 123 4567', createdAt: '2024-01-15T10:30:00Z', totalOrders: 8, totalSpent: 3456.0, lastOrderDate: '2024-11-10T14:20:00Z', status: 'active' as const, newsletter: true },
	{ id: 'cust-002', name: 'Emma Eriksson', email: 'emma.eriksson@example.com', phone: '+46 70 234 5678', createdAt: '2024-02-20T09:15:00Z', totalOrders: 5, totalSpent: 2134.5, lastOrderDate: '2024-11-08T11:45:00Z', status: 'active' as const, newsletter: true },
	{ id: 'cust-003', name: 'Sofia Svensson', email: 'sofia.svensson@example.com', phone: '+46 70 345 6789', createdAt: '2024-03-12T16:45:00Z', totalOrders: 12, totalSpent: 5670.25, lastOrderDate: '2024-11-12T09:30:00Z', status: 'active' as const, newsletter: false },
	{ id: 'cust-004', name: 'Olivia Johansson', email: 'olivia.johansson@example.com', createdAt: '2024-04-05T13:20:00Z', totalOrders: 3, totalSpent: 892.0, lastOrderDate: '2024-10-15T16:10:00Z', status: 'active' as const, newsletter: true },
	{ id: 'cust-005', name: 'Lisa Larsson', email: 'lisa.larsson@example.com', phone: '+46 70 456 7890', createdAt: '2024-05-18T11:00:00Z', totalOrders: 1, totalSpent: 299.0, lastOrderDate: '2024-06-01T10:20:00Z', status: 'inactive' as const, newsletter: false },
];

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const status = url.searchParams.get('status');
		const search = url.searchParams.get('search');
		const limitParam = parseInt(url.searchParams.get('limit') || '100');
		const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 100;

		let filtered = [...mockCustomers];
		if (status && status !== 'all') filtered = filtered.filter(c => c.status === status);
		if (search) {
			const q = search.toLowerCase();
			filtered = filtered.filter(c =>
				c.name.toLowerCase().includes(q) ||
				c.email.toLowerCase().includes(q) ||
				(c as { phone?: string }).phone?.toLowerCase().includes(q)
			);
		}

		return ok(filtered.slice(0, limit));
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();
		if (!(session.user as { isAdmin?: boolean }).isAdmin) return forbidden();

		const body = await request.json();
		const { name, email, phone, newsletter } = body;

		if (!name || name.trim().length < 2) return err('Name must be at least 2 characters');
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err('Invalid email format');

		return ok({
			id: `cust-${Date.now()}`,
			name,
			email,
			phone: phone || null,
			newsletter: newsletter || false,
			status: 'active',
			createdAt: new Date().toISOString(),
		});
	} catch (e) {
		return serverError(e);
	}
};
