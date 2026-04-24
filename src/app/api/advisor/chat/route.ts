import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const AGENT_URL = process.env.ADVISOR_API_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${AGENT_URL}/api/advisor/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Agent error' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
