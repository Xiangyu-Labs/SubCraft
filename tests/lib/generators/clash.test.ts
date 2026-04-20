import { describe, it, expect } from 'vitest';
import { generateClashConfig } from '@/lib/generators/clash';
import type { VlessNode, SubscriptionData } from '@/lib/types';

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
      template: 'minimal',
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
      template: 'balanced',
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
      template: 'global',
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
      template: 'minimal',
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
      template: 'minimal',
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
});
