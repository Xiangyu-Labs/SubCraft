import type { VlessNode } from '../types';
import { compact, parseName, parsePort, readTls, readTransport, safeDecode, stripBrackets } from './common';

export function parseVlessLink(link: string): VlessNode {
  if (!link.startsWith('vless://')) {
    throw new Error('Invalid vless link: must start with vless://');
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch (error) {
    throw new Error(`Failed to parse vless link: ${error}`, { cause: error });
  }
  const params = url.searchParams;

  const node: VlessNode = {
    type: 'vless',
    name: parseName(url.hash),
    server: stripBrackets(url.hostname),
    port: parsePort(url.port),
    uuid: safeDecode(url.username),
    ...readTls(params),
    ...readTransport(params),
    flow: params.get('flow') || undefined,
    packetEncoding: params.get('packetEncoding') || undefined,
  };

  const encryption = params.get('encryption');
  if (encryption && encryption !== 'none') {
    node.encryption = encryption;
  }

  if (!node.server) throw new Error('vless 链接缺少服务器地址');
  if (!node.uuid) throw new Error('vless 链接缺少 UUID');
  return compact(node);
}
