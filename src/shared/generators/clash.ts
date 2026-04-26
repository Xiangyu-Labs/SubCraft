import type { VlessNode, ClashConfig, ClashProxy, RuleTemplate as RuleTemplateType, SubscriptionData, ClashBaseConfig, ClashDNSOptions, ClashDNSConfig } from '../types';
import { ruleTemplates } from '../rules';
import { fetchRules } from './rules-fetcher';

// 默认基础配置
const DEFAULT_BASE_CONFIG: ClashBaseConfig = {
  mixedPort: 7890,
  allowLan: false,
  mode: 'rule',
  logLevel: 'info',
  ipv6: false,
};

// 默认 DNS 配置
const DEFAULT_DNS_OPTIONS: ClashDNSOptions = {
  enable: true,
  ipv6: false,
  enhancedMode: 'fake-ip',
  fakeIpRange: '198.18.0.1/16',
  fakeIpFilter: [
    '*.lan',
    '*.localdomain',
    '*.example',
    '*.invalid',
    '*.localhost',
    '*.test',
    '*.local',
    'time.*.com',
    'time.*.gov',
    'time.*.edu.cn',
    'time.*.apple.com',
    'time1.*.com',
    'time2.*.com',
    'time3.*.com',
    'time4.*.com',
    'time5.*.com',
    'time6.*.com',
    'time7.*.com',
    'ntp.*.com',
    'ntp1.*.com',
    'ntp2.*.com',
    'ntp3.*.com',
    'ntp4.*.com',
    'ntp5.*.com',
    'ntp6.*.com',
    'ntp7.*.com',
    '*.time.edu.cn',
    '*.ntp.org.cn',
    '+.pool.ntp.org',
    'time1.cloud.tencent.com',
  ],
  nameserver: [
    '119.29.29.29',
    '223.5.5.5',
  ],
  fallback: [
    'tls://1.1.1.1:853',
    'tls://8.8.8.8:853',
    'https://1.1.1.1/dns-query',
    'https://8.8.8.8/dns-query',
  ],
};

function createDNSConfig(options: ClashDNSOptions): ClashDNSConfig {
  return {
    enable: options.enable,
    ipv6: options.ipv6,
    'enhanced-mode': options.enhancedMode,
    'fake-ip-range': options.fakeIpRange,
    'fake-ip-filter': options.fakeIpFilter,
    nameserver: options.nameserver,
    fallback: options.fallback,
    'fallback-filter': {
      geoip: true,
      'geoip-code': 'CN',
      ipcidr: [
        '240.0.0.0/4',
        '0.0.0.0/32',
      ],
    },
  };
}

function vlessToClashProxy(node: VlessNode): ClashProxy {
  const proxy: ClashProxy = {
    name: node.name,
    type: 'vless',
    server: node.server,
    port: node.port,
    uuid: node.uuid,
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
  }

  if (node.fingerprint) {
    proxy['client-fingerprint'] = node.fingerprint;
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

export async function generateClashConfig(
  nodes: VlessNode[],
  subscriptionData: SubscriptionData
): Promise<ClashConfig> {
  const baseConfig = subscriptionData.baseConfig || DEFAULT_BASE_CONFIG;
  const dnsOptions = subscriptionData.dnsOptions || DEFAULT_DNS_OPTIONS;

  const template = ruleTemplates[subscriptionData.template];
  if (!template) {
    throw new Error(`Unknown rule template: ${subscriptionData.template}`);
  }

  const proxies = nodes.map(vlessToClashProxy);
  const proxyNames = proxies.map(p => p.name);

  // 下载所有规则
  const expandedRules: string[] = [];

  for (const rule of template.rules) {
    if (rule.startsWith('RULE-SET,')) {
      // 解析 RULE-SET,name,action
      const parts = rule.split(',');
      const ruleSetName = parts[1];
      const action = parts[2];

      if (template.ruleUrls && template.ruleUrls[ruleSetName]) {
        // 下载规则并展开
        try {
          const domains = await fetchRules(template.ruleUrls[ruleSetName]);
          for (const domain of domains) {
            expandedRules.push(`DOMAIN-SUFFIX,${domain},${action}`);
          }
        } catch (error) {
          console.error(`Failed to fetch rule set ${ruleSetName}:`, error);
          // 如果下载失败，保留原始 RULE-SET 规则
          expandedRules.push(rule);
        }
      } else {
        // 没有对应的 URL，保留原始规则
        expandedRules.push(rule);
      }
    } else {
      // 非 RULE-SET 规则，直接添加
      expandedRules.push(rule);
    }
  }

  const config: ClashConfig = {
    'mixed-port': baseConfig.mixedPort,
    'allow-lan': baseConfig.allowLan,
    mode: baseConfig.mode,
    'log-level': baseConfig.logLevel,
    ipv6: baseConfig.ipv6,
    dns: createDNSConfig(dnsOptions),
    proxies,
    'proxy-groups': [
      {
        name: 'PROXY',
        type: 'select',
        proxies: proxyNames,
      },
    ],
    rules: expandedRules,
  };

  return config;
}
