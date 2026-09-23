import { describe, it, expect } from 'vitest';
import { gzip } from 'pako';
import {
  encodeSubscriptionData,
  decodeSubscriptionData,
  extractEncodedData,
  validateSubscriptionData,
} from '@/shared/encoder';
import { bytesToBase64Url } from '@/shared/base64';
import type { SubscriptionData } from '@/shared/types';

describe('encoder', () => {
  const testData: SubscriptionData = {
    links: ['vless://test@example.com:443?encryption=none#TestNode'],
    template: 'blacklist',
  };

  it('should encode and decode data correctly', () => {
    const encoded = encodeSubscriptionData(testData);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');
    const decoded = decodeSubscriptionData(encoded);
    expect(decoded).toEqual(testData);
  });

  it('should handle multiple links', () => {
    const data: SubscriptionData = {
      links: ['vless://1@host1:443#Node1', 'vless://2@host2:443#Node2'],
      template: 'blacklist',
    };
    const encoded = encodeSubscriptionData(data);
    const decoded = decodeSubscriptionData(encoded);
    expect(decoded.links).toHaveLength(2);
  });

  it('should throw error for invalid encoded data', () => {
    expect(() => decodeSubscriptionData('invalid')).toThrow();
  });
});

describe('encoder compact format', () => {
  const links = [
    'vless://7f1c0d2e-7c8a-4b58-9a2e-4d0b1f3a9e11@hk.example.com:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=www.microsoft.com&fp=chrome&pbk=Zq3V0y7nQx1mJ8rT2aB5cD6eF7gH8iJ9kL0mN1oP2qR&sid=6ba85179&type=tcp#HK',
  ];

  it('omits defaults and round-trips the rest', () => {
    const data: SubscriptionData = {
      links,
      upstreams: ['https://panel.example.com/sub/x'],
      template: 'whitelist-adguard',
      name: '我的订阅',
      baseConfig: { mixedPort: 7891, allowLan: false, mode: 'rule', logLevel: 'info', ipv6: false },
      userinfo: { total: 100 * 1024 ** 3, expire: 1893456000 },
    };
    expect(decodeSubscriptionData(encodeSubscriptionData(data))).toEqual(data);
  });

  it('drops a base config equal to the defaults', () => {
    const decoded = decodeSubscriptionData(encodeSubscriptionData({
      links,
      template: 'blacklist',
      baseConfig: { mixedPort: 7890, allowLan: false, mode: 'rule', logLevel: 'info', ipv6: false },
    }));
    expect(decoded.baseConfig).toBeUndefined();
  });

  it('is much shorter than gzipped full json', () => {
    const data: SubscriptionData = {
      links,
      template: 'blacklist',
      baseConfig: { mixedPort: 7890, allowLan: false, mode: 'rule', logLevel: 'info', ipv6: false },
    };
    const gzipped = bytesToBase64Url(gzip(JSON.stringify(data)));
    expect(encodeSubscriptionData(data).length).toBeLessThan(gzipped.length * 0.8);
  });

  it('extracts data from a subscription url', () => {
    expect(extractEncodedData('https://sub.test/api/sub?data=abc')).toBe('abc');
    expect(extractEncodedData('not a url')).toBeNull();
  });
});

describe('validateSubscriptionData', () => {
  const ok: SubscriptionData = { links: ['vless://u@h:443#N'], template: 'blacklist' };

  it('accepts minimal data and upstream-only data', () => {
    expect(validateSubscriptionData(ok)).toBe(ok);
    expect(() => validateSubscriptionData({ links: [], upstreams: ['https://x.com'], template: 'blacklist' })).not.toThrow();
  });

  it('rejects malformed data', () => {
    expect(() => validateSubscriptionData(null)).toThrow();
    expect(() => validateSubscriptionData({ ...ok, links: 'x' })).toThrow();
    expect(() => validateSubscriptionData({ ...ok, template: 'nope' })).toThrow();
    expect(() => validateSubscriptionData({ ...ok, userinfo: { total: -1 } })).toThrow();
    expect(() => validateSubscriptionData({ links: [], template: 'blacklist' })).toThrow();
  });
});
