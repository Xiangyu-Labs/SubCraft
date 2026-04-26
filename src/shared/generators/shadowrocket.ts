import type { VlessNode, SubscriptionData, ShadowrocketConfig } from '../types';
import { ruleTemplates } from '../rules';
import { fetchRules } from './rules-fetcher';
function vlessToShadowrocketProxy(node: VlessNode): string {
  const parts: string[] = [
    node.name + ' = vless',
    node.server,
    String(node.port),
    'password=' + node.uuid,
  ];

  if (node.tls) {
    parts.push('tls=true');
    if (node.allowInsecure) {
      parts.push('skip-cert-verify=true');
    }
    if (node.sni) {
      parts.push('peer=' + node.sni);
    }
    if (node.alpn) {
      parts.push('alpn=' + node.alpn);
    }
  }

  if (node.fingerprint) {
    parts.push('client-fingerprint=' + node.fingerprint);
  }

  if (node.publicKey) {
    parts.push('pbk=' + node.publicKey);
  }

  if (node.shortId) {
    parts.push('sid=' + node.shortId);
  }

  if (node.flow) {
    parts.push('flow=' + node.flow);
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
