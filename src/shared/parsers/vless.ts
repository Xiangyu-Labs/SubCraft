import type { VlessNode } from '../types';

export function parseVlessLink(link: string): VlessNode {
  if (!link.startsWith('vless://')) {
    throw new Error('Invalid vless link: must start with vless://');
  }

  try {
    const url = new URL(link);
    const params = url.searchParams;

    const name = decodeURIComponent(url.hash.slice(1)) || 'Unnamed';
    const server = url.hostname;
    const port = parseInt(url.port) || 443;
    const uuid = url.username;

    const node: VlessNode = {
      name,
      server,
      port,
      uuid,
    };

    // 解析安全选项
    const security = params.get('security');
    if (security === 'tls' || security === 'reality') {
      node.tls = true;
      node.sni = params.get('sni') || undefined;
      node.alpn = params.get('alpn') || undefined;
    }

    if (security === 'reality') {
      node.fingerprint = params.get('fp') || undefined;
      node.publicKey = params.get('pbk') || undefined;
      node.shortId = params.get('sid') || undefined;
    }

    // 解析传输协议
    const type = params.get('type');
    if (type) {
      node.network = type;
    }
    if (type === 'ws') {
      node.wsPath = params.get('path') || '/';
      node.wsHost = params.get('host') || undefined;
    }

    // 解析 flow
    const flow = params.get('flow');
    if (flow) {
      node.flow = flow;
    }

    return node;
  } catch (error) {
    throw new Error(`Failed to parse vless link: ${error}`);
  }
}
