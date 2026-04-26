import { describe, it, expect } from 'vitest';
import { generateClashConfig } from '@/shared/generators/clash';
import type { VlessNode, SubscriptionData } from '@/shared/types';

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

  it('should generate basic clash config', async () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
    };
    const config = await generateClashConfig(testNodes, subscriptionData);

    expect(config.proxies).toHaveLength(1);
    expect(config.proxies[0].name).toBe('Node1');
    expect(config.proxies[0].type).toBe('vless');
    expect(config['proxy-groups']).toBeDefined();
    expect(config.rules).toBeDefined();
    expect(config['mixed-port']).toBe(7890);
    expect(config.dns).toBeDefined();
  });

  it('should include expanded rules for balanced template', async () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist-adguard',
      client: 'clash',
    };
    const config = await generateClashConfig(testNodes, subscriptionData);

    expect(config.rules).toBeDefined();
    expect(config.rules.length).toBeGreaterThan(0);
  });

  it('should create proxy group with all nodes', async () => {
    const nodes: VlessNode[] = [
      { name: 'Node1', server: 'host1', port: 443, uuid: 'uuid1' },
      { name: 'Node2', server: 'host2', port: 443, uuid: 'uuid2' },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'whitelist',
      client: 'clash',
    };
    const config = await generateClashConfig(nodes, subscriptionData);

    const proxyGroup = config['proxy-groups'].find(g => g.name === 'PROXY');
    expect(proxyGroup?.proxies).toContain('Node1');
    expect(proxyGroup?.proxies).toContain('Node2');
  });

  it('should use custom base config', async () => {
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
    const config = await generateClashConfig(testNodes, subscriptionData);

    expect(config['mixed-port']).toBe(7891);
    expect(config['allow-lan']).toBe(true);
    expect(config.mode).toBe('global');
    expect(config['log-level']).toBe('debug');
    expect(config.ipv6).toBe(true);
  });

  it('should use custom DNS config', async () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
      dnsOptions: {
        enable: false,
        ipv6: true,
        enhancedMode: 'redir-host',
        fakeIpRange: '198.19.0.1/16',
        fakeIpFilter: ['*.custom.local'],
        nameserver: ['1.1.1.1'],
        fallback: ['8.8.8.8'],
      },
    };
    const config = await generateClashConfig(testNodes, subscriptionData);

    expect(config.dns.enable).toBe(false);
    expect(config.dns.ipv6).toBe(true);
    expect(config.dns['enhanced-mode']).toBe('redir-host');
    expect(config.dns['fake-ip-range']).toBe('198.19.0.1/16');
    expect(config.dns['fake-ip-filter']).toContain('*.custom.local');
  });

  it('should generate reality vless proxy', async () => {
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
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
    };
    const config = await generateClashConfig([realityNode], subscriptionData);

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

  it('should generate grpc vless proxy', async () => {
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
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
    };
    const config = await generateClashConfig([grpcNode], subscriptionData);

    const proxy = config.proxies[0];
    expect(proxy.network).toBe('grpc');
    expect(proxy['grpc-opts']).toEqual({
      'grpc-service-name': 'MyService',
    });
  });

  it('should set skip-cert-verify from allowInsecure', async () => {
    const insecureNode: VlessNode = {
      name: 'InsecureNode',
      server: 'host.com',
      port: 443,
      uuid: 'uuid-000',
      tls: true,
      allowInsecure: true,
    };
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'clash',
    };
    const config = await generateClashConfig([insecureNode], subscriptionData);
    expect(config.proxies[0]['skip-cert-verify']).toBe(true);
  });
});
