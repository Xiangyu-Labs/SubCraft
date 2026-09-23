import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
      template: 'blacklist',
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
      template: 'blacklist',
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
      template: 'blacklist',
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

  it('returns shadowrocket conf with 200 for shadowrocket client', async () => {
    const data: SubscriptionData = {
      links: ['vless://uuid@example.com:443?encryption=none#TestNode'],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const encoded = encodeSubscriptionData(data);
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encoded}`),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/text\/plain/);
    const body = await res.text();
    expect(body).toContain('[General]');
    expect(body).toContain('TestNode');
  });
  it('dedupes node names so Clash will load the config', async () => {
    const data: SubscriptionData = {
      links: [
        'vless://uuid1@a.example.com:443?encryption=none',
        'vless://uuid2@b.example.com:443?encryption=none',
      ],
      template: 'blacklist',
      client: 'clash',
    };
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encodeSubscriptionData(data)}`),
    );
    const body = await res.text();

    expect(body).toContain('Unnamed');
    expect(body).toContain('Unnamed #2');
  });

  it('points rule providers back at the requesting origin', async () => {
    const data: SubscriptionData = {
      links: ['vless://uuid@example.com:443?encryption=none#N'],
      template: 'blacklist',
      client: 'clash',
    };
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encodeSubscriptionData(data)}`),
    );
    const body = await res.text();

    expect(body).toContain('https://app.test/api/ruleset/proxy');
    // 内联展开会产出 MB 级配置
    expect(body.length).toBeLessThan(20000);
  });

  it('tells the client how often to refresh', async () => {
    const data: SubscriptionData = {
      links: ['vless://uuid@example.com:443?encryption=none#N'],
      template: 'blacklist',
      client: 'clash',
    };
    const res = await onRequestGet(
      makeContext(`https://app.test/api/sub?data=${encodeSubscriptionData(data)}`),
    );
    expect(res.headers.get('Profile-Update-Interval')).toBe('24');
  });
});

describe('functions/api/sub headers & clients', () => {
  const LINK = 'vless://uuid@example.com:443?encryption=none#N';
  const url = (data: SubscriptionData, extra = '') =>
    `https://app.test/api/sub?data=${encodeSubscriptionData(data)}${extra}`;
  const withUA = (u: string, ua: string) =>
    ({ request: new Request(u, { headers: { 'User-Agent': ua } }) }) as Parameters<typeof onRequestGet>[0];

  afterEach(() => vi.unstubAllGlobals());

  it('never lets a response with credentials be cached', async () => {
    const res = await onRequestGet(makeContext(url({ links: [LINK], template: 'blacklist' })));
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('omits subscription-userinfo when there is no data source', async () => {
    const res = await onRequestGet(makeContext(url({ links: [LINK], template: 'blacklist' })));
    expect(res.headers.get('Subscription-Userinfo')).toBeNull();
  });

  it('uses manually entered total / expire', async () => {
    const res = await onRequestGet(makeContext(url({
      links: [LINK], template: 'blacklist', userinfo: { total: 1000, expire: 1900000000 },
    })));
    expect(res.headers.get('Subscription-Userinfo')).toBe('upload=0; download=0; total=1000; expire=1900000000');
  });

  it('sends the profile title and filename', async () => {
    const res = await onRequestGet(makeContext(url({ links: [LINK], template: 'blacklist', name: '我的' })));
    expect(res.headers.get('Profile-Title')).toBe('base64:5oiR55qE');
    expect(res.headers.get('Content-Disposition')).toContain("filename*=UTF-8''%E6%88%91%E7%9A%84.yaml");
  });

  it('picks the format from the user agent, with ?client= and legacy data taking precedence', async () => {
    const data: SubscriptionData = { links: [LINK], template: 'blacklist' };
    const sr = await onRequestGet(withUA(url(data), 'Shadowrocket/2070 CFNetwork/1485'));
    expect(await sr.text()).toContain('[Proxy]');

    const cmfa = await onRequestGet(withUA(url(data), 'ClashMetaForAndroid/2.11.1.Meta'));
    expect(await cmfa.text()).toContain('proxies:');

    const forced = await onRequestGet(withUA(url(data, '&client=clash'), 'Shadowrocket/2070'));
    expect(await forced.text()).toContain('proxies:');

    const legacy = await onRequestGet(withUA(url({ ...data, client: 'shadowrocket' }), 'clash.meta'));
    expect(await legacy.text()).toContain('[Proxy]');
  });

  it('merges upstream nodes and passes their traffic through', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      'trojan://pw@up.example.com:443#Upstream',
      { headers: { 'Subscription-Userinfo': 'upload=5; download=6; total=100; expire=1800000000' } },
    )));
    const res = await onRequestGet(makeContext(url({
      links: [LINK], upstreams: ['https://panel.example.com/sub/x'], template: 'blacklist',
      userinfo: { total: 1 },
    })));

    expect(res.status).toBe(200);
    expect(res.headers.get('Subscription-Userinfo')).toBe('upload=5; download=6; total=100; expire=1800000000');
    expect(res.headers.get('Profile-Update-Interval')).toBe('6');
    const body = await res.text();
    expect(body).toContain('Upstream');
    expect(body).toMatch(/name: '?N'?\n/);
  });

  it('returns 502 with reasons when every upstream fails and there are no local links', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('denied', { status: 403 })));
    const res = await onRequestGet(makeContext(url({
      links: [], upstreams: ['https://panel.example.com/sub/x'], template: 'blacklist',
    })));
    expect(res.status).toBe(502);
    const json = await res.json() as { details: string[] };
    expect(json.details[0]).toMatch(/403/);
  });

  it('still serves local nodes when an upstream fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    const res = await onRequestGet(makeContext(url({
      links: [LINK], upstreams: ['https://panel.example.com/sub/x'], template: 'blacklist',
    })));
    expect(res.status).toBe(200);
  });

  it('rejects an unknown template with 400', async () => {
    const res = await onRequestGet(makeContext(url({ links: [LINK], template: 'nope' as never })));
    expect(res.status).toBe(400);
  });
});
