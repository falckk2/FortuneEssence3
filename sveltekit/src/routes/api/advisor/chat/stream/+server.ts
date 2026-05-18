import type { RequestHandler } from './$types';

const AGENT_URL = process.env.ADVISOR_API_URL || 'http://127.0.0.1:8000';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	let agentRes: Response;
	try {
		agentRes = await fetch(`${AGENT_URL}/api/advisor/chat/stream`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
	} catch {
		return new Response(
			`data: ${JSON.stringify({ type: 'error', message: 'Agent unavailable' })}\n\n`,
			{ status: 503, headers: { 'Content-Type': 'text/event-stream' } }
		);
	}

	if (!agentRes.ok || !agentRes.body) {
		return new Response(
			`data: ${JSON.stringify({ type: 'error', message: 'Agent error' })}\n\n`,
			{ status: agentRes.status, headers: { 'Content-Type': 'text/event-stream' } }
		);
	}

	return new Response(agentRes.body, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'X-Accel-Buffering': 'no',
		},
	});
};
