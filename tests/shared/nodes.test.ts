import { describe, it, expect } from 'vitest';
import {
  buildNodeDirectRules,
  buildNodeFakeIpFilter,
  dedupeNodeNames,
  isIpLiteral,
  uniqueServers,
} from '@/shared/nodes';
import type { VlessNode } from '@/shared/types';

const node = (over: Partial<VlessNode>): VlessNode => ({
  name: 'N',
  server: 'example.com',
  port: 443,
  uuid: 'u',
  ...over,
});

describe('isIpLiteral', () => {
  it('recognises v4 and v6 literals', () => {
    expect(isIpLiteral('1.2.3.4')).toBe(true);
    expect(isIpLiteral('2001:db8::1')).toBe(true);
    expect(isIpLiteral('vps.example.com')).toBe(false);
  });
});

describe('uniqueServers', () => {
  it('dedupes shared servers', () => {
    const nodes = [
      node({ server: 'a.com' }),
      node({ server: 'a.com' }),
      node({ server: 'b.com' }),
    ];
    expect(uniqueServers(nodes)).toEqual(['a.com', 'b.com']);
  });
});

describe('buildNodeDirectRules', () => {
  it('uses exact DOMAIN so a bare apex domain is not swallowed whole', () => {
    expect(buildNodeDirectRules([node({ server: 'vps.example.com' })])).toEqual([
      'DOMAIN,vps.example.com,DIRECT',
    ]);
  });

  it('uses no-resolve CIDR rules for IP literals', () => {
    expect(buildNodeDirectRules([node({ server: '1.2.3.4' })])).toEqual([
      'IP-CIDR,1.2.3.4/32,DIRECT,no-resolve',
    ]);
    expect(buildNodeDirectRules([node({ server: '2001:db8::1' })])).toEqual([
      'IP-CIDR6,2001:db8::1/128,DIRECT,no-resolve',
    ]);
  });
});

describe('buildNodeFakeIpFilter', () => {
  it('covers the node domain and its subdomains', () => {
    expect(buildNodeFakeIpFilter([node({ server: 'vps.example.com' })])).toEqual([
      'vps.example.com',
      '+.vps.example.com',
    ]);
  });

  it('skips IP literals', () => {
    expect(buildNodeFakeIpFilter([node({ server: '1.2.3.4' })])).toEqual([]);
  });
});

describe('dedupeNodeNames', () => {
  it('leaves distinct names alone', () => {
    const nodes = [node({ name: 'A' }), node({ name: 'B' })];
    expect(dedupeNodeNames(nodes).map((n) => n.name)).toEqual(['A', 'B']);
  });

  it('suffixes collisions so Clash will load the config', () => {
    const nodes = [node({ name: 'A' }), node({ name: 'A' }), node({ name: 'A' })];
    expect(dedupeNodeNames(nodes).map((n) => n.name)).toEqual(['A', 'A #2', 'A #3']);
  });

  it('does not collide a second time with a pre-existing suffix', () => {
    const nodes = [node({ name: 'A' }), node({ name: 'A #2' }), node({ name: 'A' })];
    expect(dedupeNodeNames(nodes).map((n) => n.name)).toEqual(['A', 'A #2', 'A #3']);
  });

  it('falls back to Unnamed and strips commas', () => {
    const nodes = [node({ name: '' }), node({ name: '  ' }), node({ name: 'a,b' })];
    expect(dedupeNodeNames(nodes).map((n) => n.name)).toEqual([
      'Unnamed',
      'Unnamed #2',
      'a b',
    ]);
  });
});
