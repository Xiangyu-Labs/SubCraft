import type { TrojanNode } from '../types';
import { compact, parseName, parsePort, readTls, readTransport, safeDecode, stripBrackets } from './common';

export function parseTrojanLink(link: string): TrojanNode {
  if (!link.startsWith('trojan://')) {
    throw new Error('Invalid trojan link: must start with trojan://');
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch (error) {
    throw new Error(`Failed to parse trojan link: ${error}`);
  }
  const params = url.searchParams;

  const node: TrojanNode = {
    type: 'trojan',
    name: parseName(url.hash),
    server: stripBrackets(url.hostname),
    port: parsePort(url.port),
    password: safeDecode(url.username),
    // trojan 协议本身就跑在 TLS 上，缺省 security 时视为 tls
    ...readTls(params, true),
    ...readTransport(params),
  };

  if (!node.server) throw new Error('trojan 链接缺少服务器地址');
  if (!node.password) throw new Error('trojan 链接缺少密码');
  return compact(node);
}
