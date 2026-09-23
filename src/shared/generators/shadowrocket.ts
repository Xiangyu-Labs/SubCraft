import type { ProxyNode, SubscriptionData, ShadowrocketConfig, TlsOptions, TransportOptions } from '../types';
import { ruleTemplates } from '../rules';
import { localDnsFor } from '../defaults';
import {
  buildNodeDirectRules,
  GROUP_AUTO,
  GROUP_FALLBACK,
  GROUP_PROXY,
  HEALTH_CHECK_URL,
  PRIVATE_DIRECT_RULES,
} from '../nodes';

/**
 * 采用 Shadowrocket 原生的 [Proxy] 语法（参数名与它自己的分享链接一致）：
 *   名称 = 协议, 地址, 端口, password=..., tls=true, peer=SNI, allowInsecure=1,
 *   obfs=websocket|grpc, obfsParam=Host, path=...
 * 而不是 Surge 的 ws=true / ws-path / skip-cert-verify——Surge 没有 vless，
 * Shadowrocket 不保证认这套写法。
 */
function pushTls(parts: string[], node: TlsOptions) {
  if (!node.tls) return;
  parts.push('tls=true');
  if (node.sni) parts.push('peer=' + node.sni);
  if (node.alpn) parts.push('alpn=' + node.alpn);
  if (node.allowInsecure) parts.push('allowInsecure=1');
  if (node.publicKey) parts.push('pbk=' + node.publicKey);
  if (node.shortId) parts.push('sid=' + node.shortId);
}

function pushTransport(parts: string[], node: TransportOptions) {
  switch (node.network) {
    case undefined:
    case 'tcp':
      return;
    case 'ws':
      parts.push('obfs=websocket');
      if (node.path) parts.push('path=' + node.path);
      if (node.host) parts.push('obfsParam=' + node.host);
      return;
    case 'grpc':
      parts.push('obfs=grpc');
      if (node.serviceName) parts.push('path=' + node.serviceName);
      if (node.host) parts.push('obfsParam=' + node.host);
      return;
    default:
      throw new Error(`Shadowrocket 配置暂不支持 ${node.network} 传输`);
  }
}

export function toShadowrocketProxy(node: ProxyNode): string {
  const parts: string[] = [`${node.name} = ${node.type}`, node.server, String(node.port)];

  switch (node.type) {
    case 'vless':
      if (node.encryption) {
        throw new Error('Shadowrocket 配置暂不支持 VLESS Encryption');
      }
      parts.push('password=' + node.uuid);
      pushTls(parts, node);
      if (node.flow === 'xtls-rprx-vision') parts.push('xtls=2');
      pushTransport(parts, node);
      break;

    case 'vmess':
      parts.push('password=' + node.uuid, 'method=' + node.cipher, 'alterId=' + node.alterId);
      pushTls(parts, node);
      pushTransport(parts, node);
      break;

    case 'trojan':
      parts.push('password=' + node.password);
      if (node.sni) parts.push('peer=' + node.sni);
      if (node.alpn) parts.push('alpn=' + node.alpn);
      if (node.allowInsecure) parts.push('allowInsecure=1');
      pushTransport(parts, node);
      break;

    case 'ss':
      parts.push('password=' + node.password, 'method=' + node.cipher);
      if (node.obfs) {
        parts.push('obfs=' + node.obfs);
        if (node.obfsHost) parts.push('obfsParam=' + node.obfsHost);
      }
      break;

    case 'hysteria2':
      if (node.ports) {
        throw new Error('Shadowrocket 配置暂不支持 hysteria2 端口跳跃');
      }
      parts.push('auth=' + node.password);
      if (node.sni) parts.push('peer=' + node.sni);
      if (node.alpn) parts.push('alpn=' + node.alpn);
      if (node.allowInsecure) parts.push('allowInsecure=1');
      if (node.obfs && node.obfsPassword) parts.push('obfsParam=' + node.obfsPassword);
      break;

    case 'tuic':
      parts.push('password=' + node.password, 'user=' + node.uuid);
      if (node.sni) parts.push('peer=' + node.sni);
      parts.push('alpn=' + (node.alpn || 'h3'));
      if (node.allowInsecure) parts.push('allowInsecure=1');
      break;
  }

  parts.push('udp=1');
  return parts.join(', ');
}

export function generateShadowrocketConfig(
  allNodes: ProxyNode[],
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

  // [Proxy]：个别节点表达不了就跳过，不拖垮整份配置
  const nodes: ProxyNode[] = [];
  lines.push('[Proxy]');
  for (const node of allNodes) {
    try {
      lines.push(toShadowrocketProxy(node));
      nodes.push(node);
    } catch (err) {
      console.warn(`Skipped node for shadowrocket: ${err instanceof Error ? err.message : err}`);
    }
  }
  if (nodes.length === 0) {
    throw new Error('No node can be expressed in shadowrocket config');
  }
  lines.push('');

  // [Proxy Group]
  const proxyNames = nodes.map((n) => n.name).join(', ');
  lines.push('[Proxy Group]');
  if (nodes.length < 2) {
    lines.push(`${GROUP_PROXY} = select, ${proxyNames}`);
  } else {
    const probe = `url=${HEALTH_CHECK_URL}, interval=600, timeout=5`;
    lines.push(`${GROUP_PROXY} = select, ${GROUP_AUTO}, ${GROUP_FALLBACK}, ${proxyNames}`);
    lines.push(`${GROUP_AUTO} = url-test, ${proxyNames}, ${probe}, tolerance=50`);
    lines.push(`${GROUP_FALLBACK} = fallback, ${proxyNames}, ${probe}`);
  }
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
