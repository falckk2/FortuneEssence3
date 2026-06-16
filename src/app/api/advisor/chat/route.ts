import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/utils/rateLimit';

export const maxDuration = 60;

const AGENT_URL = process.env.ADVISOR_API_URL || 'http://127.0.0.1:8000';
const ADVISOR_API_SECRET = process.env.ADVISOR_API_SECRET;

const RATE_LIMIT_MAX = 10;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const allowed = await checkRateLimit('advisor-chat', ip, RATE_LIMIT_MAX);
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ADVISOR_API_SECRET) {
    headers['X-Advisor-Secret'] = ADVISOR_API_SECRET;
  }

  let res: Response;
  try {
    res = await fetch(`${AGENT_URL}/api/advisor/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: 'Agent unavailable' }, { status: 503 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Agent error' }, { status: res.status });
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return NextResponse.json({ error: 'Invalid response from agent' }, { status: 502 });
  }

  return NextResponse.json(data);
}