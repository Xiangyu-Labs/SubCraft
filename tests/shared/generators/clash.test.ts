import { describe, it, expect } from 'vitest';
import { generateClashConfig } from '@/shared/generators/clash';
import type { VlessNode, SubscriptionData } from '@/shared/types';

const ORIGIN = 'https://sub.test';

describe('clash generator', () => {
  const testNodes: VlessNode[] = [
    {
      name: 'Node1',
      server: 'example.com',
      port: 443,
      uuid: 'uuid-123',
      tls: true,
      network: 'ws',
      wsPath: '/path',
    },
  ];

  it('should generate basic clash config', () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
    };
    const config = generateClashConfig(testNodes, subscriptionData, ORIGIN);

    expect(config.proxies).toHaveLength(1);
    expect(config.proxies[0].name).toBe('Node1');
    expect(config.proxies[0].type).toBe('vless');
    expect(config['proxy-groups']).toBeDefined();
    expect(config.rules).toBeDefined();
    expect(config['mixed-port']).toBe(7890);
    expect(config.dns).toBeDefined();
  });

  it('should emit rule-providers instead of inlining rules', () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist-adguard',
      client: 'clash',
    };
    const config = generateClashConfig(testNodes, subscriptionData, ORIGIN);

    expect(config['rule-providers']).toBeDefined();
    expect(config['rule-providers']!.proxy.url).toBe(`${ORIGIN}/api/ruleset/proxy`);
    expect(config['rule-providers']!.reject.url).toBe(`${ORIGIN}/api/ruleset/reject`);
    expect(config['rule-providers']!.proxy.behavior).toBe('domain');
    // 内联展开会产出几十万条规则，这里应当只有寥寥数条
    expect(config.rules.length).toBeLessThan(50);
  });

  it('every RULE-SET rule has a matching rule provider', () => {
    for (const template of ['blacklist', 'whitelist-adguard', 'reverse-whitelist'] as const) {
      const config = generateClashConfig(
        testNodes,
        { links: [], template, client: 'clash' },
        ORIGIN,
      );
      for (const rule of config.rules) {
        if (rule.startsWith('RULE-SET,')) {
          expect(config['rule-providers']?.[rule.split(',')[1]]).toBeDefined();
        }
      }
    }
  });

  it('should create proxy group with all nodes', () => {
    const nodes: VlessNode[] = [
      { name: 'Node1', server: 'host1', port: 443, uuid: 'uuid1' },
      { name: 'Node2', server: 'host2', port: 443, uuid: 'uuid2' },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'whitelist',
      client: 'clash',
    };
    const config = generateClashConfig(nodes, subscriptionData, ORIGIN);

    const proxyGroup = config['proxy-groups'].find(g => g.name === 'PROXY');
    expect(proxyGroup?.proxies).toContain('Node1');
    expect(proxyGroup?.proxies).toContain('Node2');
  });

  it('should use custom base config', () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
      baseConfig: {
        mixedPort: 7891,
        allowLan: true,
        mode: 'global',
        logLevel: 'debug',
        ipv6: true,
      },
    };
    const config = generateClashConfig(testNodes, subscriptionData, ORIGIN);

    expect(config['mixed-port']).toBe(7891);
    expect(config['allow-lan']).toBe(true);
    expect(config.mode).toBe('global');
    expect(config['log-level']).toBe('debug');
    expect(config.ipv6).toBe(true);
  });

  describe('dns', () => {
    const basic: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
    };

    it('defaults to reachable domestic resolvers with no fallback', () => {
      const config = generateClashConfig(testNodes, basic, ORIGIN);

      expect(config.dns['proxy-server-nameserver']).toEqual(['223.5.5.5', '119.29.29.29']);
      expect(config.dns['default-nameserver']).toEqual(['223.5.5.5', '119.29.29.29']);
      expect(config.dns.fallback).toBeUndefined();
      expect(config.dns['fallback-filter']).toBeUndefined();
      expect(JSON.stringify(config.dns)).not.toMatch(/1\.1\.1\.1|8\.8\.8\.8|tls:\/\/|https:\/\//);
    });

    it('uses overseas resolvers for reverse (回国) templates', () => {
      const config = generateClashConfig(
        testNodes,
        { ...basic, template: 'reverse-blacklist' },
        ORIGIN,
      );
      expect(config.dns['proxy-server-nameserver']).toEqual(['1.1.1.1', '8.8.8.8']);
    });

    it('puts node domains in fake-ip-filter', () => {
      const config = generateClashConfig(testNodes, basic, ORIGIN);
      expect(config.dns['fake-ip-filter']).toContain('example.com');
      expect(config.dns['fake-ip-filter']).toContain('+.example.com');
    });

    it('keeps an explicit fallback but disables the geoip filter unless asked', () => {
      const config = generateClashConfig(
        testNodes,
        {
          ...basic,
          dnsOptions: {
            enable: true,
            ipv6: false,
            enhancedMode: 'fake-ip',
            fakeIpRange: '198.18.0.1/16',
            fakeIpFilter: ['*.lan'],
            nameserver: ['223.5.5.5'],
            fallback: ['tls://9.9.9.9:853'],
          },
        },
        ORIGIN,
      );

      expect(config.dns.fallback).toEqual(['tls://9.9.9.9:853']);
      // mihomo 的 fallback-filter.geoip 默认是 true，必须显式写 false 才关得掉
      expect(config.dns['fallback-filter']).toEqual({ geoip: false, ipcidr: [] });
    });

    it('honours other custom dns options', () => {
      const config = generateClashConfig(
        testNodes,
        {
          ...basic,
          dnsOptions: {
            enable: false,
            ipv6: true,
            enhancedMode: 'redir-host',
            fakeIpRange: '198.19.0.1/16',
            fakeIpFilter: ['*.custom.local'],
            nameserver: ['119.29.29.29'],
          },
        },
        ORIGIN,
      );

      expect(config.dns.enable).toBe(false);
      expect(config.dns.ipv6).toBe(true);
      expect(config.dns['enhanced-mode']).toBe('redir-host');
      expect(config.dns['fake-ip-range']).toBe('198.19.0.1/16');
      expect(config.dns['fake-ip-filter']).toContain('*.custom.local');
    });
  });

  describe('rules', () => {
    it('sends node traffic direct, ahead of everything else', () => {
      const config = generateClashConfig(
        [
          { name: 'A', server: 'vps.example.com', port: 443, uuid: 'u1' },
          { name: 'B', server: '1.2.3.4', port: 443, uuid: 'u2' },
        ],
        { links: [], template: 'whitelist', client: 'clash' },
        ORIGIN,
      );

      expect(config.rules[0]).toBe('DOMAIN,vps.example.com,DIRECT');
      expect(config.rules[1]).toBe('IP-CIDR,1.2.3.4/32,DIRECT,no-resolve');
      expect(config.rules).toContain('IP-CIDR,127.0.0.0/8,DIRECT,no-resolve');
    });

    it('does not put IP-literal nodes in fake-ip-filter', () => {
      const config = generateClashConfig(
        [{ name: 'B', server: '1.2.3.4', port: 443, uuid: 'u2' }],
        { links: [], template: 'whitelist', client: 'clash' },
        ORIGIN,
      );
      expect(config.dns['fake-ip-filter']).not.toContain('1.2.3.4');
    });
  });

  it('points geox-url at a mirror reachable from China', () => {
    const config = generateClashConfig(
      testNodes,
      { links: [], template: 'blacklist', client: 'clash' },
      ORIGIN,
    );
    expect(config['geox-url']!.mmdb).not.toContain('github.com');
    expect(config['geox-url']!.geosite).not.toContain('github.com');
  });

  it('should generate reality vless proxy', () => {
    const realityNode: VlessNode = {
      name: 'RealityNode',
      server: 'vps.example.com',
      port: 54939,
      uuid: 'uuid-456',
      network: 'tcp',
      tls: true,
      sni: 'apple.com',
      alpn: 'h2,http/1.1',
      fingerprint: 'chrome',
      publicKey: 'abc123pub',
      shortId: 'sid456',
      flow: 'xtls-rprx-vision',
    };
    const config = generateClashConfig(
      [realityNode],
      { links: [], template: 'blacklist', client: 'clash' },
      ORIGIN,
    );

    const proxy = config.proxies[0];
    expect(proxy.type).toBe('vless');
    expect(proxy.network).toBe('tcp');
    expect(proxy.tls).toBe(true);
    expect(proxy.servername).toBe('apple.com');
    expect(proxy.alpn).toEqual(['h2', 'http/1.1']);
    expect(proxy['client-fingerprint']).toBe('chrome');
    expect(proxy.flow).toBe('xtls-rprx-vision');
    expect(proxy['reality-opts']).toEqual({
      'public-key': 'abc123pub',
      'short-id': 'sid456',
    });
  });

  it('enables udp with xudp packet encoding', () => {
    const config = generateClashConfig(
      testNodes,
      { links: [], template: 'blacklist', client: 'clash' },
      ORIGIN,
    );
    expect(config.proxies[0].udp).toBe(true);
    expect(config.proxies[0]['packet-encoding']).toBe('xudp');
  });

  it('should generate grpc vless proxy', () => {
    const grpcNode: VlessNode = {
      name: 'GrpcNode',
      server: 'host.com',
      port: 443,
      uuid: 'uuid-789',
      network: 'grpc',
      tls: true,
      sni: 'host.com',
      serviceName: 'MyService',
    };
    const config = generateClashConfig(
      [grpcNode],
      { links: [], template: 'blacklist', client: 'clash' },
      ORIGIN,
    );

    const proxy = config.proxies[0];
    expect(proxy.network).toBe('grpc');
    expect(proxy['grpc-opts']).toEqual({
      'grpc-service-name': 'MyService',
    });
  });

  it('should set skip-cert-verify from allowInsecure', () => {
    const insecureNode: VlessNode = {
      name: 'InsecureNode',
      server: 'host.com',
      port: 443,
      uuid: 'uuid-000',
      tls: true,
      allowInsecure: true,
    };
    const config = generateClashConfig(
      [insecureNode],
      { links: [], template: 'blacklist', client: 'clash' },
      ORIGIN,
    );
    expect(config.proxies[0]['skip-cert-verify']).toBe(true);
  });
});
