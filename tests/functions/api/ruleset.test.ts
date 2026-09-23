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

describe('functions/api/ruleset/[name] edge cache', () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubCache() {
    const store = new Map<string, Response>();
    const cache = {
      match: vi.fn(async (req: Request) => store.get(req.url)?.clone()),
      put: vi.fn(async (req: Request, res: Response) => { store.set(req.url, res); }),
    };
    vi.stubGlobal('caches', { default: cache });
    return cache;
  }

  it('caches the converted body per format and serves hits without refetching', async () => {
    const cache = stubCache();
    const fetchMock = vi.fn().mockImplementation(async () => new Response(PAYLOAD));
    vi.stubGlobal('fetch', fetchMock);

    const first = await onRequestGet(makeContext('https://sub.test/api/ruleset/proxy?format=surge&x=1', 'proxy'));
    expect(await first.text()).toBe('DOMAIN-SUFFIX,suffix.com\nDOMAIN,exact.com');
    expect(cache.put.mock.calls[0][0].url).toBe('https://sub.test/api/ruleset/proxy?format=surge');

    const second = await onRequestGet(makeContext('https://sub.test/api/ruleset/proxy?format=surge', 'proxy'));
    expect(await second.text()).toBe('DOMAIN-SUFFIX,suffix.com\nDOMAIN,exact.com');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // clash 格式是另一个缓存键
    await onRequestGet(makeContext('https://sub.test/api/ruleset/proxy', 'proxy'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures', async () => {
    const cache = stubCache();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));
    await onRequestGet(makeContext('https://sub.test/api/ruleset/proxy', 'proxy'));
    expect(cache.put).not.toHaveBeenCalled();
  });
});
