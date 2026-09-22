import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestGet } from '../../../functions/api/ruleset/[name]';

const PAYLOAD = "payload:\n  - '+.suffix.com'\n  - 'exact.com'\n";

function makeContext(url: string, name: string): Parameters<typeof onRequestGet>[0] {
  return {
    request: new Request(url, { method: 'GET' }),
    params: { name },
  } as unknown as Parameters<typeof onRequestGet>[0];
}

describe('functions/api/ruleset/[name]', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns 404 for an unknown rule set', async () => {
    const res = await onRequestGet(makeContext('https://sub.test/api/ruleset/nope', 'nope'));
    expect(res.status).toBe(404);
  });

  it('passes the clash payload through untouched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(PAYLOAD, { status: 200 })));
    const res = await onRequestGet(makeContext('https://sub.test/api/ruleset/proxy', 'proxy'));

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('max-age=86400');
    expect(await res.text()).toBe(PAYLOAD);
  });

  it('converts to bare rule lines for surge/shadowrocket', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(PAYLOAD, { status: 200 })));
    const res = await onRequestGet(
      makeContext('https://sub.test/api/ruleset/proxy?format=surge', 'proxy'),
    );

    expect(await res.text()).toBe('DOMAIN-SUFFIX,suffix.com\nDOMAIN,exact.com');
  });

  it('returns 502 when the upstream is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    const res = await onRequestGet(makeContext('https://sub.test/api/ruleset/direct', 'direct'));
    expect(res.status).toBe(502);
  });
});
