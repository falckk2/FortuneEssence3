import { NextRequest } from 'next/server';
import { POST } from '@/app/api/advisor/chat/route';

global.fetch = jest.fn();

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/advisor/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('/api/advisor/chat (ISSUE-016)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 for invalid JSON body', async () => {
    const response = await POST(makeRequest('{not-json'));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid request body');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 503 when agent fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new TypeError('fetch failed'));

    const response = await POST(makeRequest({ message: 'hello' }));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error).toBe('Agent unavailable');
  });

  it('returns 502 when agent response is not JSON', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    const response = await POST(makeRequest({ message: 'hello' }));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toBe('Invalid response from agent');
  });

  it('returns agent data on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ reply: 'ok' }),
    });

    const response = await POST(makeRequest({ message: 'hello' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ reply: 'ok' });
  });
});