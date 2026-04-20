import { describe, it, expect } from 'vitest';
import { generateClashConfig } from '@/lib/generators/clash';
import type { VlessNode } from '@/lib/types';

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
    const config = generateClashConfig(testNodes, 'minimal');

    expect(config.proxies).toHaveLength(1);
    expect(config.proxies[0].name).toBe('Node1');
    expect(config.proxies[0].type).toBe('vless');
    expect(config['proxy-groups']).toBeDefined();
    expect(config.rules).toBeDefined();
  });

  it('should include rule providers for balanced template', () => {
    const config = generateClashConfig(testNodes, 'balanced');

    expect(config['rule-providers']).toBeDefined();
    expect(config['rule-providers']?.reject).toBeDefined();
    expect(config['rule-providers']?.proxy).toBeDefined();
  });

  it('should create proxy group with all nodes', () => {
    const nodes: VlessNode[] = [
      { name: 'Node1', server: 'host1', port: 443, uuid: 'uuid1' },
      { name: 'Node2', server: 'host2', port: 443, uuid: 'uuid2' },
    ];
    const config = generateClashConfig(nodes, 'global');

    const proxyGroup = config['proxy-groups'].find(g => g.name === 'PROXY');
    expect(proxyGroup?.proxies).toContain('Node1');
    expect(proxyGroup?.proxies).toContain('Node2');
  });
});
