import { describe, it, expect } from 'vitest';
import { buildProxyGroups, generateClashConfig, toClashProxy } from '@/shared/generators/clash';
import { generateShadowrocketConfig, toShadowrocketProxy } from '@/shared/generators/shadowrocket';
import { dedupeNodeNames } from '@/shared/nodes';
import type { ProxyNode, SubscriptionData } from '@/shared/types';

const ORIGIN = 'https://sub.test';
const DATA: SubscriptionData = { links: [], template: 'blacklist' };

const vmess: ProxyNode = {
  type: 'vmess', name: 'VM', server: 'vm.com', port: 443, uuid: 'u', alterId: 0, cipher: 'auto',
  tls: true, sni: 's.com', network: 'ws', path: '/ws?ed=2048', host: 'cdn.com',
};
const trojan: ProxyNode = {
  type: 'trojan', name: 'TJ', server: 'tj.com', port: 443, password: 'pw', tls: true, sni: 's.com',
  network: 'grpc', serviceName: 'svc',
};
const ss: ProxyNode = {
  type: 'ss', name: 'SS', server: 'ss.com', port: 8388, cipher: 'aes-256-gcm', password: 'pw',
  obfs: 'http', obfsHost: 'bing.com',
};
const hy2: ProxyNode = {
  type: 'hysteria2', name: 'HY', server: 'hy.com', port: 443, password: 'pw', sni: 's.com',
  obfs: 'salamander', obfsPassword: 'op', pinSha256: 'AB:CD',
};
const tuic: ProxyNode = {
  type: 'tuic', name: 'TU', server: 'tu.com', port: 443, uuid: 'u', password: 'pw',
  congestionControl: 'bbr', udpRelayMode: 'native',
};

describe('clash proxies', () => {
  it('vmess with ws early data', () => {
    expect(toClashProxy(vmess)).toEqual({
      name: 'VM', type: 'vmess', server: 'vm.com', port: 443, uuid: 'u', alterId: 0, cipher: 'auto',
      udp: true, tls: true, servername: 's.com', 'skip-cert-verify': false, network: 'ws',
      'ws-opts': {
        path: '/ws', headers: { Host: 'cdn.com' },
        'max-early-data': 2048, 'early-data-header-name': 'Sec-WebSocket-Protocol',
      },
    });
  });

  it('trojan uses sni instead of servername and no tls key', () => {
    const p = toClashProxy(trojan);
    expect(p).toMatchObject({ password: 'pw', sni: 's.com', network: 'grpc', 'grpc-opts': { 'grpc-service-name': 'svc' } });
    expect(p).not.toHaveProperty('tls');
    expect(p).not.toHaveProperty('servername');
  });

  it('trojan refuses transports mihomo lacks', () => {
    expect(() => toClashProxy({ ...trojan, network: 'h2' } as ProxyNode)).toThrow();
  });

  it('ss with simple-obfs', () => {
    expect(toClashProxy(ss)).toMatchObject({
      cipher: 'aes-256-gcm', password: 'pw', udp: true,
      plugin: 'obfs', 'plugin-opts': { mode: 'http', host: 'bing.com' },
    });
  });

  it('hysteria2', () => {
    expect(toClashProxy(hy2)).toMatchObject({
      password: 'pw', sni: 's.com', obfs: 'salamander', 'obfs-password': 'op', fingerprint: 'abcd',
    });
    expect(toClashProxy({ ...hy2, ports: '2000-3000' } as ProxyNode)).toMatchObject({ ports: '2000-3000' });
  });

  it('tuic defaults alpn to h3', () => {
    expect(toClashProxy(tuic)).toMatchObject({
      uuid: 'u', password: 'pw', alpn: ['h3'], 'congestion-controller': 'bbr', 'udp-relay-mode': 'native',
    });
  });

  it('vless transports', () => {
    const base = { type: 'vless', name: 'V', server: 'v.com', port: 443, uuid: 'u' } as const;
    expect(toClashProxy({ ...base, network: 'httpupgrade', path: '/up', host: 'h.com' })).toMatchObject({
      network: 'ws', 'ws-opts': { path: '/up', headers: { Host: 'h.com' }, 'v2ray-http-upgrade': true },
    });
    expect(toClashProxy({ ...base, network: 'h2', path: '/h2', host: 'h.com' })).toMatchObject({
      network: 'h2', 'h2-opts': { path: '/h2', host: ['h.com'] },
    });
    expect(toClashProxy({ ...base, network: 'xhttp', path: '/x', xhttpMode: 'auto' })).toMatchObject({
      network: 'xhttp', 'xhttp-opts': { path: '/x', mode: 'auto' },
    });
    expect(toClashProxy({ ...base, encryption: 'mlkem' })).toMatchObject({ encryption: 'mlkem' });
  });

  it('skips a node it cannot express instead of failing the whole config', () => {
    const config = generateClashConfig(
      [vmess, { ...trojan, network: 'h2' } as ProxyNode],
      DATA,
      ORIGIN,
    );
    expect(config.proxies.map((p) => p.name)).toEqual(['VM']);
    expect(config.rules).not.toContain('DOMAIN,tj.com,DIRECT');
  });
});

describe('proxy groups', () => {
  it('keeps a plain select group for a single node', () => {
    expect(buildProxyGroups(['A'])).toEqual([{ name: 'PROXY', type: 'select', proxies: ['A'] }]);
  });

  it('adds auto and fallback groups for several nodes', () => {
    const groups = buildProxyGroups(['A', 'B']);
    expect(groups[0]).toEqual({ name: 'PROXY', type: 'select', proxies: ['自动选择', '故障转移', 'A', 'B'] });
    expect(groups[1]).toMatchObject({ name: '自动选择', type: 'url-test', proxies: ['A', 'B'] });
    expect(groups[2]).toMatchObject({ name: '故障转移', type: 'fallback', proxies: ['A', 'B'] });
  });

  it('renames nodes that collide with group names', () => {
    const names = dedupeNodeNames([
      { ...ss, name: '自动选择' },
      { ...ss, name: 'PROXY' },
      { ...ss, name: 'a=b,c' },
    ]).map((n) => n.name);
    expect(names).toEqual(['自动选择 #2', 'PROXY #2', 'a b c']);
  });
});

describe('shadowrocket proxies', () => {
  it('vmess', () => {
    expect(toShadowrocketProxy(vmess)).toBe(
      'VM = vmess, vm.com, 443, password=u, method=auto, alterId=0, tls=true, peer=s.com, obfs=websocket, path=/ws?ed=2048, obfsParam=cdn.com, udp=1',
    );
  });

  it('trojan', () => {
    expect(toShadowrocketProxy(trojan)).toBe(
      'TJ = trojan, tj.com, 443, password=pw, peer=s.com, obfs=grpc, path=svc, udp=1',
    );
  });

  it('ss', () => {
    expect(toShadowrocketProxy(ss)).toBe(
      'SS = ss, ss.com, 8388, password=pw, method=aes-256-gcm, obfs=http, obfsParam=bing.com, udp=1',
    );
  });

  it('hysteria2', () => {
    expect(toShadowrocketProxy(hy2)).toBe(
      'HY = hysteria2, hy.com, 443, auth=pw, peer=s.com, obfsParam=op, udp=1',
    );
  });

  it('tuic', () => {
    expect(toShadowrocketProxy(tuic)).toBe(
      'TU = tuic, tu.com, 443, password=pw, user=u, alpn=h3, udp=1',
    );
  });

  it('vless vision', () => {
    expect(toShadowrocketProxy({
      type: 'vless', name: 'V', server: 'v.com', port: 443, uuid: 'u', tls: true, flow: 'xtls-rprx-vision',
    })).toBe('V = vless, v.com, 443, password=u, tls=true, xtls=2, udp=1');
  });

  it('writes groups and skips unsupported nodes', () => {
    const conf = generateShadowrocketConfig(
      [vmess, ss, { ...hy2, ports: '1-2' } as ProxyNode],
      DATA,
      ORIGIN,
    );
    expect(conf).toContain('PROXY = select, 自动选择, 故障转移, VM, SS');
    expect(conf).toContain('自动选择 = url-test, VM, SS, url=https://www.gstatic.com/generate_204');
    expect(conf).toContain('故障转移 = fallback, VM, SS');
    expect(conf).not.toContain('HY =');
  });
});
