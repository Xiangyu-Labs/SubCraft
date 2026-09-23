import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchUpstream, formatUserinfo, mergeUserinfo, parseUserinfo } from '@/server/upstream';
import { utf8ToBase64 } from '@/shared/base64';

const LINKS = 'vless://u@a.com:443#A\ntrojan://pw@b.com:443#B';

describe('userinfo', () => {
  it('parses and formats the header', () => {
    const u = parseUserinfo('upload=1; download=2; total=30; expire=1700000000');
    expect(u).toEqual({ upload: 1, download: 2, total: 30, expire: 1700000000 });
    expect(formatUserinfo(u!)).toBe('upload=1; download=2; total=30; expire=1700000000');
  });

  it('fills missing fields with 0 and rejects junk', () => {
    expect(parseUserinfo('total=10')).toEqual({ upload: 0, download: 0, total: 10, expire: 0 });
    expect(parseUserinfo('nonsense')).toBeNull();
    expect(parseUserinfo(null)).toBeNull();
  });

  it('sums traffic and keeps the earliest real expiry when merging', () => {
    expect(mergeUserinfo([
      { upload: 1, download: 2, total: 10, expire: 0 },
      { upload: 3, download: 4, total: 20, expire: 200 },
      { upload: 0, download: 0, total: 5, expire: 100 },
    ])).toEqual({ upload: 4, download: 6, total: 35, expire: 100 });
    expect(mergeUserinfo([])).toBeNull();
  });
});

describe('fetchUpstream', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('decodes a base64 list and reads userinfo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(utf8ToBase64(LINKS), {
      headers: { 'subscription-userinfo': 'upload=1; download=2; total=3; expire=4' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const r = await fetchUpstream('https://panel.example.com/sub/x', { selfHost: 'sub.test' });
    expect(r.error).toBeUndefined();
    expect(r.nodes.map((n) => n.name)).toEqual(['A', 'B']);
    expect(r.userinfo).toEqual({ upload: 1, download: 2, total: 3, expire: 4 });
    expect(fetchMock.mock.calls[0][1].headers['User-Agent']).toMatch(/v2rayN/);
  });

  it('refuses to fetch itself or non-http urls', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect((await fetchUpstream('https://sub.test/api/sub?data=x', { selfHost: 'sub.test' })).error).toBeTruthy();
    expect((await fetchUpstream('file:///etc/passwd', { selfHost: 'sub.test' })).error).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports http errors, oversize bodies and network failures without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 403 })));
    expect((await fetchUpstream('https://x.com', { selfHost: 's' })).error).toMatch(/403/);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('x'.repeat(100))));
    expect((await fetchUpstream('https://x.com', { selfHost: 's', maxBytes: 10 })).error).toMatch(/过大/);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    expect((await fetchUpstream('https://x.com', { selfHost: 's' })).error).toMatch(/timeout/);
  });

  it('does not follow nested subscription urls', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('https://other.com/sub\nvless://u@a.com:443#A')));
    const r = await fetchUpstream('https://x.com', { selfHost: 's' });
    expect(r.nodes).toHaveLength(1);
  });
});
