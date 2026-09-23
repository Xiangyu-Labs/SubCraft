import type { VmessNode } from '../types';
import { base64ToUtf8 } from '../base64';
import { compact, normalizeNetwork, parsePort, stripBrackets } from './common';

interface V2rayNVmess {
  ps?: string;
  add?: string;
  port?: string | number;
  id?: string;
  aid?: string | number;
  scy?: string;
  net?: string;
  type?: string;
  host?: string;
  path?: string;
  tls?: string;
  sni?: string;
  alpn?: string;
  fp?: string;
  allowInsecure?: string | number | boolean;
  mode?: string;
}

/** v2rayN 格式：vmess://base64(JSON) */
export function parseVmessLink(link: string): VmessNode {
  if (!link.startsWith('vmess://')) {
    throw new Error('Invalid vmess link: must start with vmess://');
  }

  let raw: V2rayNVmess;
  try {
    raw = JSON.parse(base64ToUtf8(link.slice('vmess://'.length).split('#')[0]));
  } catch {
    throw new Error('vmess 链接不是 v2rayN 格式（base64 编码的 JSON）');
  }

  const server = stripBrackets(String(raw.add ?? '').trim());
  const uuid = String(raw.id ?? '').trim();
  if (!server) throw new Error('vmess 链接缺少服务器地址');
  if (!uuid) throw new Error('vmess 链接缺少 UUID');

  const network = normalizeNetwork(raw.net, raw.type);
  const node: VmessNode = {
    type: 'vmess',
    name: String(raw.ps ?? '').trim() || 'Unnamed',
    server,
    port: parsePort(String(raw.port ?? '')),
    uuid,
    alterId: parseInt(String(raw.aid ?? '0'), 10) || 0,
    cipher: raw.scy || 'auto',
    network,
  };

  if (raw.tls === 'tls') {
    node.tls = true;
    node.sni = raw.sni || undefined;
    node.alpn = raw.alpn || undefined;
    node.fingerprint = raw.fp || undefined;
  }
  if (raw.allowInsecure === true || raw.allowInsecure === 1 || raw.allowInsecure === '1' || raw.allowInsecure === 'true') {
    node.allowInsecure = true;
  }

  if (network === 'grpc') {
    // v2rayN 把 gRPC 的 serviceName 放在 path 字段
    node.serviceName = raw.path || undefined;
  } else if (network && network !== 'tcp') {
    node.path = raw.path || '/';
    node.host = raw.host || undefined;
  }
  if (network === 'xhttp') {
    throw new Error('mihomo 的 xhttp 仅支持 vless');
  }

  return compact(node);
}
