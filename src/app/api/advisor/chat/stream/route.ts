import { NextRequest } from 'next/server';
import { checkRateLimit, getClientIp } from '@/utils/rateLimit';

export const maxDuration = 60;

const AGENT_URL = process.env.ADVISOR_API_URL || 'http://127.0.0.1:8000';
const ADVISOR_API_SECRET = process.env.ADVISOR_API_SECRET;

const RATE_LIMIT_MAX = 10;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const allowed = await checkRateLimit('advisor-chat', ip, RATE_LIMIT_MAX);
  if (!allowed) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Rate limit exceeded' })}\n\n`,
      { status: 429, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Invalid request body' })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADVISOR_API_SECRET) {
    headers['X-Advisor-Secret'] = ADVISOR_API_SECRET;
  }

  let agentRes: Response;
  try {
    agentRes = await fetch(`${AGENT_URL}/api/advisor/chat/stream`, {
      method: 'POST',
      headers,
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
}