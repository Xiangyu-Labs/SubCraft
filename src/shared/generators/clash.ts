import type {
  VlessNode,
  ClashConfig,
  ClashProxy,
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

function vlessToClashProxy(node: VlessNode): ClashProxy {
  const proxy: ClashProxy = {
    name: node.name,
    type: 'vless',
    server: node.server,
    port: node.port,
    uuid: node.uuid,
    udp: true,
    'packet-encoding': node.packetEncoding || 'xudp',
  };

  if (node.network) {
    proxy.network = node.network;
  }

  if (node.tls) {
    proxy.tls = true;
    proxy['skip-cert-verify'] = node.allowInsecure ?? false;
    if (node.sni) {
      proxy.servername = node.sni;
    }
    if (node.alpn) {
      proxy.alpn = node.alpn.split(',');
    }
  }

  if (node.fingerprint) {
    proxy['client-fingerprint'] = node.fingerprint;
  }

  if (node.flow) {
    proxy.flow = node.flow;
  }

  if (node.publicKey) {
    proxy['reality-opts'] = {
      'public-key': node.publicKey,
    };
    if (node.shortId) {
      proxy['reality-opts']['short-id'] = node.shortId;
    }
  }

  if (node.network === 'ws') {
    proxy['ws-opts'] = {
      path: node.wsPath || '/',
    };
    if (node.wsHost) {
      proxy['ws-opts'].headers = {
        Host: node.wsHost,
      };
    }
  }

  if (node.network === 'grpc' && node.serviceName) {
    proxy['grpc-opts'] = {
      'grpc-service-name': node.serviceName,
    };
  }

  return proxy;
}

export function generateClashConfig(
  nodes: VlessNode[],
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

  const proxies = nodes.map(vlessToClashProxy);
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
    'proxy-groups': [
      {
        name: 'PROXY',
        type: 'select',
        proxies: proxyNames,
      },
    ],
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
