import type { VlessNode, SubscriptionData, ShadowrocketConfig } from '../types';
import { ruleTemplates } from '../rules';
import { localDnsFor } from '../defaults';
import { buildNodeDirectRules, PRIVATE_DIRECT_RULES } from '../nodes';

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
      // Surge / Shadowrocket 的语法是 Key:Value，多个 header 用 | 分隔。
      // 少了 Host: 前缀会被当成无名 header，ws+CDN 节点必然握手失败。
      parts.push('ws-headers=Host:' + node.wsHost);
    }
  }

  if (node.network === 'grpc' && node.serviceName) {
    parts.push('grpc=true');
    parts.push('grpc-service-name=' + node.serviceName);
  }

  return parts.join(', ');
}

export function generateShadowrocketConfig(
  nodes: VlessNode[],
  subscriptionData: SubscriptionData,
  origin: string,
): ShadowrocketConfig {
  const template = ruleTemplates[subscriptionData.template];
  if (!template) {
    throw new Error(`Unknown rule template: ${subscriptionData.template}`);
  }

  // [General]
  const lines: string[] = [
    '[General]',
    'bypass-system = true',
    'skip-proxy = 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, localhost, *.local, captive.apple.com',
    'dns-server = ' + localDnsFor(subscriptionData.template).join(', '),
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

  // 节点自身与私网永远直连，放在最前面
  for (const rule of buildNodeDirectRules(nodes)) {
    lines.push(rule);
  }
  for (const rule of PRIVATE_DIRECT_RULES) {
    lines.push(rule);
  }

  for (const rule of template.rules) {
    if (rule.startsWith('RULE-SET,')) {
      const parts = rule.split(',');
      const ruleSetName = parts[1];
      const action = parts[2];

      if (!template.ruleUrls?.[ruleSetName]) {
        console.warn(`Rule set ${ruleSetName} has no source url, dropped`);
        continue;
      }

      // Shadowrocket 的语法是 RULE-SET,<完整URL>,<POLICY>，名字形式非法
      lines.push(
        `RULE-SET,${origin}/api/ruleset/${ruleSetName}?format=surge,${action}`,
      );
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
