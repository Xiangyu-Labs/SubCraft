import type { TlsOptions, TransportNetwork, TransportOptions } from '../types';

/** 百分号编码不合法时原样返回，而不是让整条链接解析失败 */
export function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function parseName(hash: string): string {
  return safeDecode(hash.replace(/^#/, '')).trim() || 'Unnamed';
}

/** IPv6 字面量在 url.hostname 里带方括号，写进 Clash 的 server 会非法 */
export function stripBrackets(host: string): string {
  return host.replace(/^\[|\]$/g, '');
}

export function parsePort(port: string, fallback = 443): number {
  const n = parseInt(port, 10);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : fallback;
}

export function isTruthy(v: string | null | undefined): boolean {
  return v === '1' || v === 'true';
}

const UNSUPPORTED_NETWORKS = new Set(['kcp', 'mkcp', 'quic', 'splithttp']);

/**
 * 把分享链接里的传输类型归一化。
 * xray 的 `type=http` 指的是 HTTP/2 传输；伪装成 HTTP 的 TCP 则是
 * `type=tcp&headerType=http`，对应 mihomo 的 `network: http`。
 */
export function normalizeNetwork(
  type: string | null | undefined,
  headerType?: string | null,
): TransportNetwork | undefined {
  const t = (type || '').toLowerCase();
  if (!t || t === 'tcp' || t === 'raw') {
    return headerType === 'http' ? 'http' : t ? 'tcp' : undefined;
  }
  if (t === 'http' || t === 'h2') return 'h2';
  if (t === 'ws' || t === 'grpc' || t === 'httpupgrade' || t === 'xhttp') return t;
  if (UNSUPPORTED_NETWORKS.has(t)) {
    throw new Error(`不支持的传输方式 ${t}`);
  }
  throw new Error(`未知的传输方式 ${t}`);
}

/** vless / trojan 共用的分享链接参数（v2rayN / xray 标准） */
export function readTransport(params: URLSearchParams): TransportOptions {
  const out: TransportOptions = {};
  const network = normalizeNetwork(params.get('type'), params.get('headerType'));
  if (network) out.network = network;

  switch (network) {
    case 'ws':
    case 'httpupgrade':
    case 'h2':
    case 'http':
    case 'xhttp':
      out.path = params.get('path') || '/';
      out.host = params.get('host') || undefined;
      break;
    case 'grpc':
      out.serviceName = params.get('serviceName') || undefined;
      break;
  }
  if (network === 'xhttp') {
    out.xhttpMode = params.get('mode') || undefined;
  }
  return out;
}

export function readTls(params: URLSearchParams, defaultTls = false): TlsOptions {
  const out: TlsOptions = {};
  const security = params.get('security');
  const tls = security === 'tls' || security === 'reality' || (defaultTls && security !== 'none');
  if (tls) {
    out.tls = true;
    // peer 是老版本 trojan 链接里 sni 的别名
    out.sni = params.get('sni') || params.get('peer') || undefined;
    out.alpn = params.get('alpn') || undefined;
    // fp 是 uTLS 指纹，对普通 TLS 同样有效，不只属于 reality
    out.fingerprint = params.get('fp') || undefined;
  }
  if (security === 'reality') {
    out.publicKey = params.get('pbk') || undefined;
    out.shortId = params.get('sid') || undefined;
  }
  if (isTruthy(params.get('allowInsecure')) || isTruthy(params.get('insecure'))) {
    out.allowInsecure = true;
  }
  return out;
}

/** 去掉值为 undefined 的键，方便测试断言、也让生成的配置更干净 */
export function compact<T extends object>(obj: T): T {
  for (const key of Object.keys(obj) as Array<keyof T>) {
    if (obj[key] === undefined) delete obj[key];
  }
  return obj;
}
