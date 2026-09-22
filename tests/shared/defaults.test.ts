import { describe, it, expect } from 'vitest';
import {
  CN_UDP_DNS,
  DEFAULT_FAKE_IP_FILTER,
  INTL_UDP_DNS,
  dnsDefaultsFor,
  localDnsFor,
  normalizeDnsOptions,
} from '@/shared/defaults';
import type { ClashDNSOptions } from '@/shared/types';

const CUSTOM_DNS: ClashDNSOptions = {
  enable: true,
  ipv6: false,
  enhancedMode: 'fake-ip',
  fakeIpRange: '198.18.0.1/16',
  fakeIpFilter: ['*.lan', '*.local', '*.localhost'],
  nameserver: ['119.29.29.29', '223.5.5.5'],
};

describe('localDnsFor', () => {
  it('uses domestic resolvers for outbound templates', () => {
    expect(localDnsFor('blacklist')).toEqual(CN_UDP_DNS);
    expect(localDnsFor('whitelist-adguard')).toEqual(CN_UDP_DNS);
  });

  it('uses overseas resolvers for 回国 templates', () => {
    expect(localDnsFor('reverse-blacklist')).toEqual(INTL_UDP_DNS);
    expect(localDnsFor('reverse-whitelist-adguard')).toEqual(INTL_UDP_DNS);
  });
});

describe('dnsDefaultsFor', () => {
  it('never ships a fallback', () => {
    const d = dnsDefaultsFor('blacklist');
    expect(d.fallback).toBeUndefined();
    expect(d.useFallbackFilter).toBeUndefined();
  });

  it('always sets the resolvers used to reach the proxy server', () => {
    const d = dnsDefaultsFor('blacklist');
    expect(d.proxyServerNameserver).toEqual(CN_UDP_DNS);
    expect(d.defaultNameserver).toEqual(CN_UDP_DNS);
  });
});

describe('normalizeDnsOptions', () => {
  it('fills in the defaults when nothing is supplied', () => {
    const o = normalizeDnsOptions(undefined, 'blacklist');
    expect(o.proxyServerNameserver).toEqual(CN_UDP_DNS);
    expect(o.fallback).toBeUndefined();
  });

  it('routes a 回国 template to overseas resolvers', () => {
    const o = normalizeDnsOptions(CUSTOM_DNS, 'reverse-whitelist');
    expect(o.proxyServerNameserver).toEqual(INTL_UDP_DNS);
  });

  it('tops up an empty fake-ip-filter', () => {
    const o = normalizeDnsOptions({ ...CUSTOM_DNS, fakeIpFilter: [] }, 'blacklist');
    expect(o.fakeIpFilter).toEqual(DEFAULT_FAKE_IP_FILTER);
  });

  it('keeps an explicit fallback when one is supplied', () => {
    const o = normalizeDnsOptions(
      { ...CUSTOM_DNS, fallback: ['tls://9.9.9.9:853'] },
      'blacklist',
    );
    expect(o.fallback).toEqual(['tls://9.9.9.9:853']);
    expect(o.useFallbackFilter).toBeFalsy();
  });

  it('rejects DoH/DoT in the two bootstrap resolver slots', () => {
    const o = normalizeDnsOptions(
      {
        ...CUSTOM_DNS,
        defaultNameserver: ['https://dns.alidns.com/dns-query'],
        proxyServerNameserver: ['tls://dot.pub'],
      },
      'blacklist',
    );
    expect(o.defaultNameserver).toEqual(CN_UDP_DNS);
    expect(o.proxyServerNameserver).toEqual(CN_UDP_DNS);
  });

  it('keeps plain UDP resolvers the caller chose', () => {
    const o = normalizeDnsOptions(
      { ...CUSTOM_DNS, proxyServerNameserver: ['180.76.76.76'] },
      'blacklist',
    );
    expect(o.proxyServerNameserver).toEqual(['180.76.76.76']);
  });

  it('drops an empty fallback rather than emitting one', () => {
    const o = normalizeDnsOptions({ ...CUSTOM_DNS, fallback: [] }, 'blacklist');
    expect(o.fallback).toBeUndefined();
    expect(o.useFallbackFilter).toBe(false);
  });
});
