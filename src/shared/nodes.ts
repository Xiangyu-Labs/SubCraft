import type { ProxyNode } from './types';

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export function isIpLiteral(host: string): boolean {
  return IPV4.test(host) || host.includes(':');
}

export function uniqueServers(nodes: ProxyNode[]): string[] {
  return [...new Set(nodes.map((n) => n.server).filter(Boolean))];
}

/**
 * 节点自身地址永远直连，放在 rules 最前面。
 * proxy-server-nameserver 负责让域名解析得出来，这条规则则保证解析出的 IP
 * 不会被 MATCH,PROXY 之类的兜底规则绕回代理自身形成自环。
 *
 * 用 DOMAIN 精确匹配而非 DOMAIN-SUFFIX：节点若挂在自己也会浏览的裸域上，
 * SUFFIX 会误伤整个站点。
 */
export function buildNodeDirectRules(nodes: ProxyNode[]): string[] {
  return uniqueServers(nodes).map((host) => {
    if (!isIpLiteral(host)) {
      return `DOMAIN,${host},DIRECT`;
    }
    return host.includes(':')
      ? `IP-CIDR6,${host}/128,DIRECT,no-resolve`
      : `IP-CIDR,${host}/32,DIRECT,no-resolve`;
  });
}

/** 节点域名要进 fake-ip-filter，保证任何路径拿到的都是真实 IP */
export function buildNodeFakeIpFilter(nodes: ProxyNode[]): string[] {
  return uniqueServers(nodes)
    .filter((host) => !isIpLiteral(host))
    .flatMap((host) => [host, `+.${host}`]);
}

export const PRIVATE_DIRECT_RULES = [
  'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
  'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve',
  'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
  'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve',
];

export const GROUP_PROXY = 'PROXY';
export const GROUP_AUTO = '自动选择';
export const GROUP_FALLBACK = '故障转移';
/** 测速请求经由节点发出，不受国内直连可达性约束 */
export const HEALTH_CHECK_URL = 'https://www.gstatic.com/generate_204';

const RESERVED_NAMES = [GROUP_PROXY, GROUP_AUTO, GROUP_FALLBACK, 'DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'GLOBAL'];

/**
 * mihomo 对重名 proxy 直接 fatal（proxy XXX is the duplicate name），
 * 而解析器在 hash 为空时一律回落成 'Unnamed'——两个没写备注的节点就能
 * 炸掉整份配置。逗号和等号也要去掉，它们会破坏 Shadowrocket 的 .conf 行格式。
 */
export function dedupeNodeNames(nodes: ProxyNode[]): ProxyNode[] {
  // 预先占住策略组与内置策略的名字，节点撞上它们同样会被 mihomo 拒绝
  const used = new Set<string>(RESERVED_NAMES);
  return nodes.map((node) => {
    const base = (node.name || '').trim().replace(/[,=]/g, ' ').trim() || 'Unnamed';
    let name = base;
    let i = 1;
    // while 而非 if：防止 "A" 与既有的 "A #2" 二次撞名
    while (used.has(name)) {
      i += 1;
      name = `${base} #${i}`;
    }
    used.add(name);
    return name === node.name ? node : ({ ...node, name } as ProxyNode);
  });
}
