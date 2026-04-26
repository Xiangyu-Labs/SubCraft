import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestGet } from '../../../functions/api/sub';
import { encodeSubscriptionData } from '@/shared/encoder';
import type { SubscriptionData } from '@/shared/types';

function makeContext(url: string): Parameters<typeof onRequestGet>[0] {
  return {
    request: new Request(url, { method: 'GET' }),
  } as Parameters<typeof onRequestGet>[0];
}

describe('functions/api/sub', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('payload:\n  - example.com\n', { status: 200 }),
    ));
  });

  it('returns 400 when data param is missing', async () => {
    const res = await onRequestGet(makeContext('https://app.test/api/sub'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when data is unparseable', async () => {
    const res = await onRequestGet(
      makeContext('https://app.test/api/sub?data=not-base64'),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when no valid links decode', async () => {
    const data: SubscriptionData = {
      links: ['not-a-vless-link'],
      template: 'pure',
      client: 'clash',
    };
    const encoded = encodeSubscriptionData(data);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encoded}`),
    );
    expect(res.status).toBe(400);
  });

  it('returns yaml with 200 for a valid vless link', async () => {
    const data: SubscriptionData = {
      links: ['vless://uuid@example.com:443?encryption=none#TestNode'],
      template: 'pure',
      client: 'clash',
    };
    const encoded = encodeSubscriptionData(data);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encoded}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/yaml/);
    const body = await res.text();
    expect(body).toContain('proxies:');
    expect(body).toContain('TestNode');
  });

  it('returns 200 with only valid nodes when some links fail', async () => {
    const data: SubscriptionData = {
      links: [
        'vless://uuid@example.com:443?encryption=none#ValidNode',
        'not-a-vless-link',
      ],
      template: 'pure',
      client: 'clash',
    };
    const encoded = encodeSubscriptionData(data);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encoded}`),
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('ValidNode');
    expect(body).not.toContain('not-a-vless-link');
  });

  it('returns 400 when data param exceeds 64KB', async () => {
    const oversized = 'a'.repeat(65537);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${oversized}`),
    );
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe('Data too large');
  });
});
