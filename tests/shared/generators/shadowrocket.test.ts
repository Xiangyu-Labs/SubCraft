import { describe, it, expect } from 'vitest';
import { generateShadowrocketConfig } from '@/shared/generators/shadowrocket';
import type { VlessNode, SubscriptionData } from '@/shared/types';

const ORIGIN = 'https://sub.test';

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

  it('should generate basic shadowrocket config', () => {
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = generateShadowrocketConfig(testNodes, subscriptionData, ORIGIN);

    expect(config).toContain('[General]');
    expect(config).toContain('[Proxy]');
    expect(config).toContain('[Proxy Group]');
    expect(config).toContain('[Rule]');
    expect(config).toContain('Node1 = vless');
    expect(config).toContain('PROXY = select');
  });

  it('should include vless with tls', () => {
    const nodes: VlessNode[] = [
      { name: 'TlsNode', server: 'host.com', port: 443, uuid: 'uuid-tls', tls: true, sni: 'sni.com', alpn: 'h2,http/1.1' },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = generateShadowrocketConfig(nodes, subscriptionData, ORIGIN);

    expect(config).toContain('TlsNode = vless, host.com, 443, password=uuid-tls, tls=true, peer=sni.com, alpn=h2,http/1.1');
  });

  it('should include skip-cert-verify when allowInsecure is true', () => {
    const nodes: VlessNode[] = [
      { name: 'InsecureNode', server: 'host.com', port: 443, uuid: 'uuid-i', tls: true, allowInsecure: true },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = generateShadowrocketConfig(nodes, subscriptionData, ORIGIN);

    expect(config).toContain('InsecureNode = vless, host.com, 443, password=uuid-i, tls=true, skip-cert-verify=true');
  });

  it('should include vless without tls', () => {
    const nodes: VlessNode[] = [
      { name: 'PlainNode', server: 'host.com', port: 80, uuid: 'uuid-p' },
    ];
    const subscriptionData: SubscriptionData = {
      links: [],
      template: 'blacklist',
      client: 'shadowrocket',
    };
    const config = generateShadowrocketConfig(nodes, subscriptionData, ORIGIN);

    expect(config).toContain('PlainNode = vless, host.com, 80, password=uuid-p');
    expect(config).not.toContain('tls=true');
  });

  it('should include vless with reality', () => {
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
    const config = generateShadowrocketConfig(nodes, subscriptionData, ORIGIN);

    expect(config).toContain('RealityNode = vless, vps.com, 54939, password=uuid-r, tls=true, peer=apple.com');
    expect(config).toContain('client-fingerprint=chrome');
    expect(config).toContain('pbk=pk123');
    expect(config).toContain('sid=sid456');
  });

  it('should include ws opts', () => {
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
    const config = generateShadowrocketConfig(nodes, subscriptionData, ORIGIN);

    expect(config).toContain('ws=true');
    expect(config).toContain('ws-path=/ws');
    expect(config).toContain('ws-headers=Host:ws.host.com');
  });

  it('should include grpc opts', () => {
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
    const config = generateShadowrocketConfig(nodes, subscriptionData, ORIGIN);

    expect(config).toContain('GrpcNode = vless, grpc.com, 443, password=uuid-g');
    expect(config).toContain('grpc=true');
    expect(config).toContain('grpc-service-name=MyService');
  });
  it('references rule sets by absolute url, never by bare name', () => {
    const config = generateShadowrocketConfig(
      testNodes,
      { links: [], template: 'blacklist-adguard', client: 'shadowrocket' },
      ORIGIN,
    );

    expect(config).toContain(`RULE-SET,${ORIGIN}/api/ruleset/proxy?format=surge,PROXY`);
    expect(config).toContain(`RULE-SET,${ORIGIN}/api/ruleset/reject?format=surge,REJECT`);
    expect(config).not.toMatch(/RULE-SET,[a-z]+,/);
  });

  it('sends node and private traffic direct, ahead of everything else', () => {
    const config = generateShadowrocketConfig(
      testNodes,
      { links: [], template: 'whitelist', client: 'shadowrocket' },
      ORIGIN,
    );
    const rules = config.slice(config.indexOf('[Rule]')).split('\n');

    expect(rules[1]).toBe('DOMAIN,example.com,DIRECT');
    expect(rules).toContain('IP-CIDR,127.0.0.0/8,DIRECT,no-resolve');
  });

  it('picks the dns servers matching the template direction', () => {
    const cn = generateShadowrocketConfig(
      testNodes,
      { links: [], template: 'blacklist', client: 'shadowrocket' },
      ORIGIN,
    );
    const overseas = generateShadowrocketConfig(
      testNodes,
      { links: [], template: 'reverse-blacklist', client: 'shadowrocket' },
      ORIGIN,
    );

    expect(cn).toContain('dns-server = 223.5.5.5, 119.29.29.29');
    expect(overseas).toContain('dns-server = 1.1.1.1, 8.8.8.8');
  });

  it('maps MATCH,DIRECT to FINAL,DIRECT', () => {
    const config = generateShadowrocketConfig(
      testNodes,
      { links: [], template: 'blacklist', client: 'shadowrocket' },
      ORIGIN,
    );
    expect(config).toContain('FINAL,DIRECT');
    expect(config).not.toContain('MATCH,');
  });
});
