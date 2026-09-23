import type { ProxyNode } from '@/shared/types';
import { decodeSubscriptionBody, parseLinkList } from '@/shared/parsers';

export interface Userinfo {
  upload: number;
  download: number;
  total: number;
  expire: number;
}

/** 解析 `upload=1; download=2; total=3; expire=4`，字段缺失按 0 处理 */
export function parseUserinfo(header: string | null): Userinfo | null {
  if (!header) return null;
  const info: Userinfo = { upload: 0, download: 0, total: 0, expire: 0 };
  let found = false;
  for (const part of header.split(';')) {
    const [k, v] = part.split('=').map((s) => s.trim().toLowerCase());
    if (k in info) {
      const n = Math.floor(Number(v));
      if (Number.isFinite(n) && n >= 0) {
        info[k as keyof Userinfo] = n;
        found = true;
      }
    }
  }
  return found ? info : null;
}

export function formatUserinfo(u: Userinfo): string {
  return `upload=${u.upload}; download=${u.download}; total=${u.total}; expire=${u.expire}`;
}

/** 多个上游：流量求和，到期取最早的非 0 值（0 表示不过期） */
export function mergeUserinfo(list: Userinfo[]): Userinfo | null {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  const expires = list.map((u) => u.expire).filter((e) => e > 0);
  return {
    upload: list.reduce((s, u) => s + u.upload, 0),
    download: list.reduce((s, u) => s + u.download, 0),
    total: list.reduce((s, u) => s + u.total, 0),
    expire: expires.length ? Math.min(...expires) : 0,
  };
}

export interface UpstreamResult {
  nodes: ProxyNode[];
  userinfo: Userinfo | null;
  error?: string;
}

export interface FetchUpstreamOptions {
  /** 本站 host，禁止把自己的订阅当上游，否则会无限递归 */
  selfHost: string;
  timeoutMs?: number;
  maxBytes?: number;
}

// 让 3x-ui / Marzban / Xboard 之类的面板返回 base64 链接列表，而不是 Clash YAML
const UPSTREAM_UA = 'v2rayN/7.0';

async function readLimited(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) throw new Error('上游订阅过大');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('上游订阅过大');
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

/** 拉取上游订阅。失败不抛出，而是把原因放进 error，由调用方决定是否整体失败 */
export async function fetchUpstream(
  rawUrl: string,
  { selfHost, timeoutMs = 10_000, maxBytes = 5 * 1024 * 1024 }: FetchUpstreamOptions,
): Promise<UpstreamResult> {
  const fail = (error: string): UpstreamResult => ({ nodes: [], userinfo: null, error });

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return fail('上游地址不合法');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return fail('上游地址只支持 http(s)');
  }
  if (url.host === selfHost) {
    return fail('上游地址不能指向 SubCraft 自己');
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { 'User-Agent': UPSTREAM_UA, Accept: '*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    return fail(`上游请求失败：${err instanceof Error ? err.message : err}`);
  }
  if (!response.ok) {
    return fail(`上游返回 HTTP ${response.status}`);
  }

  let links: string;
  try {
    links = decodeSubscriptionBody(await readLimited(response, maxBytes));
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }

  const { nodes } = parseLinkList(links, { allowUpstreams: false });
  return {
    nodes,
    userinfo: parseUserinfo(response.headers.get('subscription-userinfo')),
    error: nodes.length ? undefined : '上游订阅里没有可用节点',
  };
}
