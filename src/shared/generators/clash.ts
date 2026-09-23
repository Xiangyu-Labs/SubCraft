import type {
  ProxyNode,
  VlessNode,
  VmessNode,
  TrojanNode,
  ClashConfig,
  ClashProxy,
  ClashProxyGroup,
  ClashRuleProvider,
  SubscriptionData,
  ClashDNSOptions,
  ClashDNSConfig,
} from '../types';
import { ruleTemplates } from '../rules';
import {
  DEFAULT_BASE_CONFIG,
  GEOX_MIRROR,
  normalizeDnsOptions,
} from '../defaults';
import {
  buildNodeDirectRules,
  buildNodeFakeIpFilter,
  GROUP_AUTO,
  GROUP_FALLBACK,
  GROUP_PROXY,
  HEALTH_CHECK_URL,
  PRIVATE_DIRECT_RULES,
} from '../nodes';

const GEOX_BASE = `${GEOX_MIRROR}/gh/MetaCubeX/meta-rules-dat@release`;

export function createDNSConfig(
  options: ClashDNSOptions,
  extraFakeIpFilter: string[] = [],
): ClashDNSConfig {
  const config: ClashDNSConfig = {
    enable: options.enable,
    ipv6: options.ipv6,
    'enhanced-mode': options.enhancedMode,
    'fake-ip-range': options.fakeIpRange,
    'fake-ip-filter': [...new Set([...options.fakeIpFilter, ...extraFakeIpFilter])],
    'default-nameserver': options.defaultNameserver!,
    nameserver: options.nameserver,
    'proxy-server-nameserver': options.proxyServerNameserver!,
  };

  if (options.nameserverPolicy && Object.keys(options.nameserverPolicy).length) {
    config['nameserver-policy'] = options.nameserverPolicy;
  }

  // 默认整段不输出，仅当调用方显式给了 fallback 才出现
  if (options.fallback?.length) {
    config.fallback = options.fallback;
    config['fallback-filter'] = options.useFallbackFilter
      ? {
          geoip: true,
          'geoip-code': 'CN',
          ipcidr: ['240.0.0.0/4', '0.0.0.0/32'],
        }
      // 必须显式关闭：mihomo 的 fallback-filter.geoip 默认值是 true，不写等于打开
      : { geoip: false, ipcidr: [] };
  }

  return config;
}

type TlsTransportNode = VlessNode | VmessNode | TrojanNode;

/** ws 路径里的 ?ed=2048 是 xray 的 early data 写法，mihomo 要拆成独立字段 */
function splitEarlyData(path: string): { path: string; ed?: number } {
  const m = path.match(/[?&]ed=(\d+)/);
  if (!m) return { path };
  const cleaned = path.replace(/([?&])ed=\d+&?/, '$1').replace(/[?&]$/, '');
  return { path: cleaned || '/', ed: parseInt(m[1], 10) };
}

function applyTls(proxy: ClashProxy, node: TlsTransportNode) {
  if (!node.tls) return;
  if (node.type !== 'trojan') {
    proxy.tls = true;
  }
  // trojan 的 SNI 字段叫 sni，vless / vmess 叫 servername
  if (node.sni) {
    proxy[node.type === 'trojan' ? 'sni' : 'servername'] = node.sni;
  }
  proxy['skip-cert-verify'] = node.allowInsecure ?? false;
  if (node.alpn) {
    proxy.alpn = node.alpn.split(',');
  }
  if (node.fingerprint) {
    proxy['client-fingerprint'] = node.fingerprint;
  }
  if (node.publicKey) {
    proxy['reality-opts'] = {
      'public-key': node.publicKey,
      ...(node.shortId ? { 'short-id': node.shortId } : {}),
    };
  }
}

function applyTransport(proxy: ClashProxy, node: TlsTransportNode) {
  const network = node.network;
  if (!network || network === 'tcp') {
    if (network) proxy.network = network;
    return;
  }

  // mihomo 的 trojan 只支持 ws / grpc，xhttp 只支持 vless
  if (node.type === 'trojan' && network !== 'ws' && network !== 'grpc') {
    throw new Error(`mihomo 的 trojan 不支持 ${network} 传输`);
  }
  if (network === 'xhttp' && node.type !== 'vless') {
    throw new Error('mihomo 的 xhttp 仅支持 vless');
  }

  const headers = node.host ? { Host: node.host } : undefined;
  switch (network) {
    case 'ws':
    case 'httpupgrade': {
      const { path, ed } = splitEarlyData(node.path || '/');
      proxy.network = 'ws';
      proxy['ws-opts'] = {
        path,
        ...(headers ? { headers } : {}),
        ...(network === 'httpupgrade' ? { 'v2ray-http-upgrade': true } : {}),
        ...(ed ? { 'max-early-data': ed, 'early-data-header-name': 'Sec-WebSocket-Protocol' } : {}),
      };
      break;
    }
    case 'h2':
      proxy.network = 'h2';
      proxy['h2-opts'] = {
        path: node.path || '/',
        ...(node.host ? { host: node.host.split(',') } : {}),
      };
      break;
    case 'http':
      proxy.network = 'http';
      proxy['http-opts'] = {
        path: [node.path || '/'],
        ...(node.host ? { headers: { Host: node.host.split(',') } } : {}),
      };
      break;
    case 'grpc':
      proxy.network = 'grpc';
      if (node.serviceName) {
        proxy['grpc-opts'] = { 'grpc-service-name': node.serviceName };
      }
      break;
    case 'xhttp':
      proxy.network = 'xhttp';
      proxy['xhttp-opts'] = {
        path: node.path || '/',
        ...(node.host ? { host: node.host } : {}),
        ...(node.xhttpMode ? { mode: node.xhttpMode } : {}),
      };
      break;
  }
}

function base(node: ProxyNode): ClashProxy {
  return { name: node.name, type: node.type, server: node.server, port: node.port };
}

export function toClashProxy(node: ProxyNode): ClashProxy {
  const proxy = base(node);

  switch (node.type) {
    case 'vless':
      proxy.uuid = node.uuid;
      proxy.udp = true;
      proxy['packet-encoding'] = node.packetEncoding || 'xudp';
      if (node.flow) proxy.flow = node.flow;
      if (node.encryption) proxy.encryption = node.encryption;
      applyTls(proxy, node);
      applyTransport(proxy, node);
      break;

    case 'vmess':
      proxy.uuid = node.uuid;
      proxy.alterId = node.alterId;
      proxy.cipher = node.cipher;
      proxy.udp = true;
      applyTls(proxy, node);
      applyTransport(proxy, node);
      break;

    case 'trojan':
      proxy.password = node.password;
      proxy.udp = true;
      applyTls(proxy, node);
      applyTransport(proxy, node);
      break;

    case 'ss':
      proxy.cipher = node.cipher;
      proxy.password = node.password;
      proxy.udp = true;
      if (node.obfs) {
        proxy.plugin = 'obfs';
        proxy['plugin-opts'] = {
          mode: node.obfs,
          ...(node.obfsHost ? { host: node.obfsHost } : {}),
        };
      }
      break;

    case 'hysteria2':
      proxy.password = node.password;
      if (node.ports) proxy.ports = node.ports;
      if (node.sni) proxy.sni = node.sni;
      proxy['skip-cert-verify'] = node.allowInsecure ?? false;
      if (node.alpn) proxy.alpn = node.alpn.split(',');
      if (node.obfs) {
        proxy.obfs = node.obfs;
        if (node.obfsPassword) proxy['obfs-password'] = node.obfsPassword;
      }
      if (node.pinSha256) {
        proxy.fingerprint = node.pinSha256.replace(/:/g, '').toLowerCase();
      }
      break;

    case 'tuic':
      proxy.uuid = node.uuid;
      proxy.password = node.password;
      if (node.sni) proxy.sni = node.sni;
      proxy['skip-cert-verify'] = node.allowInsecure ?? false;
      proxy.alpn = (node.alpn || 'h3').split(',');
      if (node.congestionControl) proxy['congestion-controller'] = node.congestionControl;
      if (node.udpRelayMode) proxy['udp-relay-mode'] = node.udpRelayMode;
      break;
  }

  return proxy;
}

/** 两个及以上节点时追加自动选择 / 故障转移；PROXY 名字不变，模板规则无需改动 */
export function buildProxyGroups(names: string[]): ClashProxyGroup[] {
  if (names.length < 2) {
    return [{ name: GROUP_PROXY, type: 'select', proxies: names }];
  }
  const probe = { url: HEALTH_CHECK_URL, interval: 300, lazy: true };
  return [
    { name: GROUP_PROXY, type: 'select', proxies: [GROUP_AUTO, GROUP_FALLBACK, ...names] },
    { name: GROUP_AUTO, type: 'url-test', proxies: names, ...probe, tolerance: 50 },
    { name: GROUP_FALLBACK, type: 'fallback', proxies: names, ...probe },
  ];
}

export function generateClashConfig(
  allNodes: ProxyNode[],
  subscriptionData: SubscriptionData,
  origin: string,
): ClashConfig {
  const baseConfig = subscriptionData.baseConfig || DEFAULT_BASE_CONFIG;
  const dnsOptions = normalizeDnsOptions(
    subscriptionData.dnsOptions,
    subscriptionData.template,
  );

  const template = ruleTemplates[subscriptionData.template];
  if (!template) {
    throw new Error(`Unknown rule template: ${subscriptionData.template}`);
  }

  // 个别节点无法用 mihomo 表达时跳过它，而不是让整份配置生成失败
  const proxies: ClashProxy[] = [];
  const nodes: ProxyNode[] = [];
  for (const node of allNodes) {
    try {
      proxies.push(toClashProxy(node));
      nodes.push(node);
    } catch (err) {
      console.warn(`Skipped node for clash: ${err instanceof Error ? err.message : err}`);
    }
  }
  if (proxies.length === 0) {
    throw new Error('No node can be expressed in clash config');
  }
  const proxyNames = proxies.map((p) => p.name);

  // 规则集交给客户端自取：内联展开会产出几十万条规则、MB 级配置，
  // 服务端 CPU 和手机端解析都扛不住。
  const ruleProviders: Record<string, ClashRuleProvider> = {};
  const templateRules: string[] = [];

  for (const rule of template.rules) {
    if (!rule.startsWith('RULE-SET,')) {
      templateRules.push(rule);
      continue;
    }

    const ruleSetName = rule.split(',')[1];
    if (!template.ruleUrls?.[ruleSetName]) {
      // 不变式：rules 里出现 RULE-SET,X ⟺ rule-providers 里存在 X。
      // 悬空的 RULE-SET 会让 mihomo 拒绝加载整份配置。
      console.warn(`Rule set ${ruleSetName} has no source url, dropped`);
      continue;
    }

    ruleProviders[ruleSetName] = {
      type: 'http',
      behavior: 'domain',
      format: 'yaml',
      url: `${origin}/api/ruleset/${ruleSetName}`,
      path: `./ruleset/subcraft-${ruleSetName}.yaml`,
      interval: 86400,
    };
    templateRules.push(rule);
  }

  const config: ClashConfig = {
    'mixed-port': baseConfig.mixedPort,
    'allow-lan': baseConfig.allowLan,
    mode: baseConfig.mode,
    'log-level': baseConfig.logLevel,
    ipv6: baseConfig.ipv6,
    'unified-delay': true,
    'tcp-concurrent': true,
    'geodata-mode': false,
    'geo-auto-update': true,
    'geo-update-interval': 24,
    'geox-url': {
      geoip: `${GEOX_BASE}/geoip.dat`,
      geosite: `${GEOX_BASE}/geosite.dat`,
      mmdb: `${GEOX_BASE}/country.mmdb`,
    },
    dns: createDNSConfig(dnsOptions, buildNodeFakeIpFilter(nodes)),
    proxies,
    'proxy-groups': buildProxyGroups(proxyNames),
    rules: [
      ...buildNodeDirectRules(nodes),
      ...PRIVATE_DIRECT_RULES,
      ...templateRules,
    ],
  };

  if (Object.keys(ruleProviders).length) {
    config['rule-providers'] = ruleProviders;
  }

  return config;
}
