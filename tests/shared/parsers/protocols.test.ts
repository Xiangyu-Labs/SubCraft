import { describe, it, expect } from 'vitest';
import {
  decodeSubscriptionBody,
  parseLinkList,
  parseProxyLink,
} from '@/shared/parsers';
import { utf8ToBase64 } from '@/shared/base64';

const b64 = (s: string) => utf8ToBase64(s);
const b64url = (s: string) => b64(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

describe('vless extras', () => {
  it('maps xray transports onto the normalized network names', () => {
    expect(parseProxyLink('vless://u@h:443?type=http&path=/h2&host=a.com#N')).toMatchObject({
      network: 'h2', path: '/h2', host: 'a.com',
    });
    expect(parseProxyLink('vless://u@h:443?type=tcp&headerType=http&path=/x#N')).toMatchObject({
      network: 'http', path: '/x',
    });
    expect(parseProxyLink('vless://u@h:443?type=httpupgrade&path=/up&host=b.com#N')).toMatchObject({
      network: 'httpupgrade', path: '/up', host: 'b.com',
    });
    expect(parseProxyLink('vless://u@h:443?type=xhttp&path=/x&mode=packet-up#N')).toMatchObject({
      network: 'xhttp', path: '/x', xhttpMode: 'packet-up',
    });
  });

  it('keeps a non-none VLESS encryption', () => {
    expect(parseProxyLink('vless://u@h:443?encryption=none#N')).not.toHaveProperty('encryption');
    expect(parseProxyLink('vless://u@h:443?encryption=mlkem768x25519plus.native.0rtt.abc#N')).toMatchObject({
      encryption: 'mlkem768x25519plus.native.0rtt.abc',
    });
  });

  it('rejects transports mihomo cannot express', () => {
    expect(() => parseProxyLink('vless://u@h:443?type=kcp#N')).toThrow(/kcp/);
  });

  it('accepts an upper-case scheme', () => {
    expect(parseProxyLink('VLESS://u@h:443#N').type).toBe('vless');
  });
});

describe('vmess', () => {
  const json = {
    v: '2', ps: '香港 01', add: 'vm.example.com', port: '8443', id: 'uuid-1', aid: '0',
    scy: 'auto', net: 'ws', type: 'none', host: 'cdn.example.com', path: '/ws', tls: 'tls', sni: 'sni.example.com',
  };

  it('parses the v2rayN base64 json format', () => {
    const node = parseProxyLink('vmess://' + b64(JSON.stringify(json)));
    expect(node).toMatchObject({
      type: 'vmess', name: '香港 01', server: 'vm.example.com', port: 8443, uuid: 'uuid-1',
      alterId: 0, cipher: 'auto', network: 'ws', path: '/ws', host: 'cdn.example.com',
      tls: true, sni: 'sni.example.com',
    });
  });

  it('reads the grpc service name from path', () => {
    const node = parseProxyLink('vmess://' + b64(JSON.stringify({ ...json, net: 'grpc', path: 'svc' })));
    expect(node).toMatchObject({ network: 'grpc', serviceName: 'svc' });
  });

  it('rejects garbage', () => {
    expect(() => parseProxyLink('vmess://not-json')).toThrow();
  });
});

describe('trojan', () => {
  it('defaults to tls and reads peer as sni', () => {
    const node = parseProxyLink('trojan://p%40ss@t.example.com:443?peer=sni.com&allowInsecure=1#T');
    expect(node).toMatchObject({
      type: 'trojan', password: 'p@ss', server: 't.example.com', tls: true,
      sni: 'sni.com', allowInsecure: true,
    });
  });

  it('parses ws transport', () => {
    const node = parseProxyLink('trojan://pw@h:443?security=tls&type=ws&path=%2Fws&host=cdn.com#T');
    expect(node).toMatchObject({ network: 'ws', path: '/ws', host: 'cdn.com' });
  });
});

describe('ss', () => {
  it('parses SIP002 with base64url userinfo', () => {
    const node = parseProxyLink(`ss://${b64url('aes-256-gcm:secret')}@ss.example.com:8388#SS%20Node`);
    expect(node).toMatchObject({
      type: 'ss', name: 'SS Node', server: 'ss.example.com', port: 8388,
      cipher: 'aes-256-gcm', password: 'secret',
    });
  });

  it('parses SS2022 plain userinfo', () => {
    const node = parseProxyLink('ss://2022-blake3-aes-128-gcm:a2V5%3D@h:443#N');
    expect(node).toMatchObject({ cipher: '2022-blake3-aes-128-gcm', password: 'a2V5=' });
  });

  it('parses the legacy all-in-base64 format', () => {
    const node = parseProxyLink(`ss://${b64('chacha20-ietf-poly1305:pw@1.2.3.4:443')}#Old`);
    expect(node).toMatchObject({ name: 'Old', server: '1.2.3.4', port: 443, cipher: 'chacha20-ietf-poly1305', password: 'pw' });
  });

  it('parses simple-obfs and rejects other plugins', () => {
    const node = parseProxyLink(`ss://${b64url('aes-128-gcm:pw')}@h:80/?plugin=obfs-local%3Bobfs%3Dhttp%3Bobfs-host%3Dbing.com#N`);
    expect(node).toMatchObject({ obfs: 'http', obfsHost: 'bing.com' });
    expect(() => parseProxyLink(`ss://${b64url('aes-128-gcm:pw')}@h:80/?plugin=v2ray-plugin#N`)).toThrow(/插件/);
  });
});

describe('hysteria2', () => {
  it('parses hy2 alias with obfs', () => {
    const node = parseProxyLink('hy2://auth@hy.example.com:443/?sni=s.com&obfs=salamander&obfs-password=op&insecure=1#H');
    expect(node).toMatchObject({
      type: 'hysteria2', password: 'auth', server: 'hy.example.com', port: 443,
      sni: 's.com', obfs: 'salamander', obfsPassword: 'op', allowInsecure: true,
    });
  });

  it('extracts a port-hopping range written in the address', () => {
    const node = parseProxyLink('hysteria2://auth@hy.example.com:20000-30000/?sni=s.com#H');
    expect(node).toMatchObject({ port: 20000, ports: '20000-30000' });
  });

  it('reads mport', () => {
    const node = parseProxyLink('hysteria2://auth@h:443?mport=1000-2000#H');
    expect(node).toMatchObject({ port: 443, ports: '1000-2000' });
  });
});

describe('tuic', () => {
  it('parses v5 links', () => {
    const node = parseProxyLink('tuic://uuid:pw@tu.example.com:443?congestion_control=bbr&alpn=h3&sni=s.com&udp_relay_mode=native&allow_insecure=1#TU');
    expect(node).toMatchObject({
      type: 'tuic', uuid: 'uuid', password: 'pw', congestionControl: 'bbr',
      alpn: 'h3', sni: 's.com', udpRelayMode: 'native', allowInsecure: true,
    });
  });

  it('rejects v4 token-only links', () => {
    expect(() => parseProxyLink('tuic://token@h:443#TU')).toThrow();
  });
});

describe('parseProxyLink', () => {
  it('names the unsupported scheme', () => {
    expect(() => parseProxyLink('wireguard://x@h:1')).toThrow(/wireguard/);
    expect(() => parseProxyLink('hello')).toThrow();
  });
});

describe('parseLinkList', () => {
  it('splits nodes, upstreams and errors with line numbers', () => {
    const text = [
      'vless://u@a.com:443#A',
      '',
      '# comment',
      'https://panel.example.com/sub/abc',
      'garbage',
      'trojan://pw@b.com:443#B',
    ].join('\n');
    const r = parseLinkList(text);

    expect(r.nodes.map((n) => n.name)).toEqual(['A', 'B']);
    expect(r.links).toEqual(['vless://u@a.com:443#A', 'trojan://pw@b.com:443#B']);
    expect(r.upstreams).toEqual(['https://panel.example.com/sub/abc']);
    expect(r.errors).toEqual([{ line: 5, message: expect.any(String) }]);
    expect(r.entries.map((e) => e.kind)).toEqual(['node', 'upstream', 'error', 'node']);
  });

  it('refuses nested upstreams when told to', () => {
    const r = parseLinkList('https://x.com/sub', { allowUpstreams: false });
    expect(r.upstreams).toEqual([]);
    expect(r.errors).toHaveLength(1);
  });

  it('keeps the @https:// cleanup', () => {
    const r = parseLinkList('vless://u@https://a.com:443#A');
    expect(r.nodes[0].server).toBe('a.com');
  });
});

describe('decodeSubscriptionBody', () => {
  const plain = 'vless://u@a.com:443#A\ntrojan://p@b.com:443#B';

  it('passes plain link lists through', () => {
    expect(decodeSubscriptionBody(plain)).toBe(plain);
  });

  it('decodes base64 link lists', () => {
    expect(decodeSubscriptionBody(b64(plain))).toBe(plain);
    expect(decodeSubscriptionBody(b64(plain).replace(/(.{20})/g, '$1\n'))).toBe(plain);
  });

  it('explains clash yaml is unsupported', () => {
    expect(() => decodeSubscriptionBody('mixed-port: 7890\nproxies:\n  - name: a')).toThrow(/YAML/);
  });

  it('rejects unrecognisable content', () => {
    expect(() => decodeSubscriptionBody('<html>login</html>')).toThrow();
  });
});
