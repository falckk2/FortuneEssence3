import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const AGENT_URL = process.env.ADVISOR_API_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${AGENT_URL}/api/advisor/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
