import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ok, err, unauthorized, serverError } from '$lib/utils/api';

const mockReviews = [
	{
		id: 'rev-001',
		productId: 'lavender-oil-10ml',
		userId: 'user-001',
		userName: 'Anna S.',
		rating: 5,
		title: 'Fantastisk kvalitet!',
		comment: 'Denna lavendelolja är helt underbar. Doften är ren och naturlig, inte kemisk som vissa andra märken. Jag använder den i min diffuser varje kväll och sover mycket bättre nu. Kommer definitivt köpa igen!',
		verified: true,
		helpful: 12,
		createdAt: '2024-10-15T14:30:00Z',
	},
	{
		id: 'rev-002',
		productId: 'lavender-oil-10ml',
		userId: 'user-002',
		userName: 'Emma L.',
		rating: 4,
		title: 'Bra produkt',
		comment: 'Mycket nöjd med oljan. Doften är härlig och lugnar verkligen. Bara minuspoängen är att flaskan är ganska liten för priset, men kvaliteten är värd det.',
		verified: true,
		helpful: 8,
		createdAt: '2024-10-22T09:15:00Z',
	},
	{
		id: 'rev-003',
		productId: 'peppermint-oil-10ml',
		userId: 'user-003',
		userName: 'Sofia M.',
		rating: 5,
		title: 'Perfekt mot huvudvärk',
		comment: 'Använder denna vid huvudvärk och det fungerar verkligen! Blandad med lite kokosolja på tinningarna ger det omedelbar lindring. Stark men behaglig mintdoft.',
		verified: true,
		helpful: 15,
		createdAt: '2024-11-01T16:45:00Z',
	},
];

export const GET: RequestHandler = async ({ url }) => {
	try {
		const productId = url.searchParams.get('productId');
		const limitParam = parseInt(url.searchParams.get('limit') || '50');
		const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 50;

		if (!productId) return err('Product ID is required');

		const filtered = mockReviews.filter(r => r.productId === productId).slice(0, limit);
		return ok(filtered);
	} catch (e) {
		return serverError(e);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.auth();
		if (!session?.user?.id) return unauthorized();

		const body = await request.json();
		const { productId, rating, title, comment } = body;

		if (!productId || !rating || !title || !comment) return err('All fields are required');
		if (rating < 1 || rating > 5) return err('Rating must be between 1 and 5');
		if (title.trim().length < 5 || title.trim().length > 100) return err('Title must be between 5 and 100 characters');
		if (comment.trim().length < 20 || comment.trim().length > 1000) return err('Comment must be between 20 and 1000 characters');

		return ok({
			id: `rev-${Date.now()}`,
			productId,
			rating,
			title: title.trim(),
			comment: comment.trim(),
			verified: false,
			helpful: 0,
			createdAt: new Date().toISOString(),
		});
	} catch (e) {
		return serverError(e);
	}
};
