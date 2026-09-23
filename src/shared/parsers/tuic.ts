import type { TuicNode } from '../types';
import { compact, isTruthy, parseName, parsePort, safeDecode, stripBrackets } from './common';

/** tuic://uuid:password@host:port?congestion_control=bbr&alpn=h3&sni=&udp_relay_mode=native#name（仅 v5） */
export function parseTuicLink(link: string): TuicNode {
  if (!link.startsWith('tuic://')) {
    throw new Error('Invalid tuic link: must start with tuic://');
  }

  let url: URL;
  try {
    url = new URL(link);
  } catch (error) {
    throw new Error(`Failed to parse tuic link: ${error}`, { cause: error });
  }
  const params = url.searchParams;

  const node: TuicNode = {
    type: 'tuic',
    name: parseName(url.hash),
    server: stripBrackets(url.hostname),
    port: parsePort(url.port),
    uuid: safeDecode(url.username),
    password: safeDecode(url.password),
    sni: params.get('sni') || undefined,
    alpn: params.get('alpn') || undefined,
    allowInsecure: isTruthy(params.get('allow_insecure')) || isTruthy(params.get('insecure')) || undefined,
    congestionControl: params.get('congestion_control') || undefined,
    udpRelayMode: params.get('udp_relay_mode') || undefined,
  };

  if (!node.server) throw new Error('tuic 链接缺少服务器地址');
  if (!node.uuid || !node.password) throw new Error('tuic 链接缺少 UUID 或密码（仅支持 TUIC v5）');
  return compact(node);
}
