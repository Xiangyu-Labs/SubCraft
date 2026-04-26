import { describe, it, expect } from 'vitest';
import { generateShadowrocketConfig } from '@/shared/generators/shadowrocket';
import type { VlessNode, SubscriptionData } from '@/shared/types';

describe('shadowrocket generator', () => {
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

  it('should generate basic shadowrocket config', async () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(testNodes, subscriptionData);

    expect(config).toContain('[General]');
    expect(config).toContain('[Proxy]');
    expect(config).toContain('[Proxy Group]');
    expect(config).toContain('[Rule]');
    expect(config).toContain('Node1 = vless');
    expect(config).toContain('PROXY = select');
  });

  it('should include vless with tls', async () => {
    const nodes: VlessNode[] = [
      { name: 'TlsNode', server: 'host.com', port: 443, uuid: 'uuid-tls', tls: true, sni: 'sni.com' },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('TlsNode = vless, host.com, 443, password=uuid-tls, tls=true, peer=sni.com');
  });

  it('should include vless with reality', async () => {
    const nodes: VlessNode[] = [
      {
        name: 'RealityNode',
        server: 'vps.com',
        port: 54939,
        uuid: 'uuid-r',
        network: 'tcp',
        tls: true,
        sni: 'apple.com',
        fingerprint: 'chrome',
        publicKey: 'pk123',
        shortId: 'sid456',
      },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('RealityNode = vless, vps.com, 54939, password=uuid-r, tls=true, peer=apple.com');
    expect(config).toContain('client-fingerprint=chrome');
  });

  it('should include ws opts', async () => {
    const nodes: VlessNode[] = [
      {
        name: 'WsNode',
        server: 'ws.com',
        port: 443,
        uuid: 'uuid-ws',
        network: 'ws',
        wsPath: '/ws',
        wsHost: 'ws.host.com',
      },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('ws=true');
    expect(config).toContain('ws-path=/ws');
    expect(config).toContain('ws-headers=ws.host.com');
  });

  it('should include grpc opts', async () => {
    const nodes: VlessNode[] = [
      {
        name: 'GrpcNode',
        server: 'grpc.com',
        port: 443,
        uuid: 'uuid-g',
        network: 'grpc',
        serviceName: 'MyService',
      },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = await generateShadowrocketConfig(nodes, subscriptionData);

    expect(config).toContain('GrpcNode = vless, grpc.com, 443, password=uuid-g');
    expect(config).toContain('grpc=true');
    expect(config).toContain('grpc-service-name=MyService');
  });
});
