import type { VlessNode, SubscriptionData, ShadowrocketConfig } from '../types';
import { ruleTemplates } from '../rules';

// 下载并解析规则文件（复用 clash.ts 的逻辑）
async function fetchRules(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch rules from ${url}: ${response.statusText}`);
  }

  const text = await response.text();
  const lines = text.split('\n');
  const rules: string[] = [];
  let inPayload = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'payload:') {
      inPayload = true;
      continue;
    }
    if (inPayload && trimmed.startsWith('- ')) {
      let domain = trimmed.slice(2).replace(/^['"]|['"]$/g, '');
      domain = domain.replace(/^\+\./, '');
      rules.push(domain);
    }
  }

  return rules;
}

function vlessToShadowrocketProxy(node: VlessNode): string {
  const parts: string[] = [
    node.name + ' = vless',
    node.server,
    String(node.port),
    'uuid=' + node.uuid,
  ];

  if (node.tls) {
    parts.push('tls=true');
    if (node.allowInsecure) {
      parts.push('skip-cert-verify=true');
    }
    if (node.sni) {
      parts.push('servername=' + node.sni);
    }
  }

  if (node.fingerprint) {
    parts.push('client-fingerprint=' + node.fingerprint);
  }

  if (node.network === 'ws') {
    parts.push('ws=true');
    if (node.wsPath) {
      parts.push('ws-path=' + node.wsPath);
    }
    if (node.wsHost) {
      parts.push('ws-headers=' + node.wsHost);
    }
  }

  if (node.network === 'grpc' && node.serviceName) {
    parts.push('grpc=true');
    parts.push('grpc-service-name=' + node.serviceName);
  }

  return parts.join(', ');
}

export async function generateShadowrocketConfig(
  nodes: VlessNode[],
  subscriptionData: SubscriptionData,
): Promise<ShadowrocketConfig> {
  const template = ruleTemplates[subscriptionData.template];
  if (!template) {
    throw new Error(`Unknown rule template: ${subscriptionData.template}`);
  }

  // [General]
  const lines: string[] = [
    '[General]',
    'bypass-system = true',
    'skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local, captive.apple.com',
    'dns-server = 223.5.5.5, 119.29.29.29',
    '',
  ];

  // [Proxy]
  lines.push('[Proxy]');
  for (const node of nodes) {
    lines.push(vlessToShadowrocketProxy(node));
  }
  lines.push('');

  // [Proxy Group]
  const proxyNames = nodes.map((n) => n.name);
  lines.push('[Proxy Group]');
  lines.push('PROXY = select, ' + proxyNames.join(', '));
  lines.push('');

  // [Rule]
  lines.push('[Rule]');

  for (const rule of template.rules) {
    if (rule.startsWith('RULE-SET,')) {
      const parts = rule.split(',');
      const ruleSetName = parts[1];
      const action = parts[2];

      if (template.ruleUrls && template.ruleUrls[ruleSetName]) {
        try {
          const domains = await fetchRules(template.ruleUrls[ruleSetName]);
          for (const domain of domains) {
            lines.push('DOMAIN-SUFFIX,' + domain + ',' + action);
          }
        } catch (error) {
          console.error(`Failed to fetch rule set ${ruleSetName}:`, error);
          lines.push(rule);
        }
      } else {
        lines.push(rule);
      }
    } else if (rule === 'GEOIP,CN,DIRECT') {
      lines.push('GEOIP,CN,DIRECT');
    } else if (rule === 'MATCH,PROXY') {
      lines.push('FINAL,PROXY');
    } else if (rule === 'MATCH,DIRECT') {
      lines.push('FINAL,DIRECT');
    } else {
      lines.push(rule);
    }
  }

  return lines.join('\n');
}
