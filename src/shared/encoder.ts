import pako from 'pako';
import type { ClashBaseConfig, SubscriptionData } from './types';
import { base64ToBytes, bytesToBase64Url } from './base64';
import { DEFAULT_BASE_CONFIG } from './defaults';
import { ruleTemplates } from './rules';

/**
 * 链接格式：短键 JSON + deflateRaw，省略等于默认值的字段。
 * 节点凭据是高熵数据压不动，省下的主要是键名、默认值和 gzip 头。
 */
interface CompactData {
  l?: string[];
  u?: string[];
  t: string;
  n?: string;
  b?: Partial<ClashBaseConfig>;
  d?: SubscriptionData['dnsOptions'];
  i?: SubscriptionData['userinfo'];
}

function diffBaseConfig(config?: ClashBaseConfig): Partial<ClashBaseConfig> | undefined {
  if (!config) return undefined;
  const diff: Partial<ClashBaseConfig> = {};
  for (const key of Object.keys(DEFAULT_BASE_CONFIG) as Array<keyof ClashBaseConfig>) {
    if (config[key] !== undefined && config[key] !== DEFAULT_BASE_CONFIG[key]) {
      (diff as Record<string, unknown>)[key] = config[key];
    }
  }
  return Object.keys(diff).length ? diff : undefined;
}

function toCompact(data: SubscriptionData): CompactData {
  const c: CompactData = { t: data.template };
  if (data.links.length) c.l = data.links;
  if (data.upstreams?.length) c.u = data.upstreams;
  if (data.name) c.n = data.name;
  const b = diffBaseConfig(data.baseConfig);
  if (b) c.b = b;
  if (data.dnsOptions) c.d = data.dnsOptions;
  if (data.userinfo && (data.userinfo.total || data.userinfo.expire)) c.i = data.userinfo;
  return c;
}

function fromCompact(c: CompactData): SubscriptionData {
  const data: SubscriptionData = {
    links: c.l ?? [],
    template: c.t as SubscriptionData['template'],
  };
  if (c.u) data.upstreams = c.u;
  if (c.n) data.name = c.n;
  if (c.b) data.baseConfig = { ...DEFAULT_BASE_CONFIG, ...c.b };
  if (c.d) data.dnsOptions = c.d;
  if (c.i) data.userinfo = c.i;
  return data;
}

export function encodeSubscriptionData(data: SubscriptionData): string {
  const json = JSON.stringify(toCompact(data));
  return bytesToBase64Url(pako.deflateRaw(json, { level: 9 }));
}

export function decodeSubscriptionData(encoded: string): SubscriptionData {
  try {
    const bytes = base64ToBytes(encoded);
    return fromCompact(JSON.parse(pako.inflateRaw(bytes, { to: 'string' })) as CompactData);
  } catch {
    throw new Error('Invalid encoded data');
  }
}

/** 从订阅链接里取出 data 参数；不是 SubCraft 链接时返回 null */
export function extractEncodedData(subscriptionUrl: string): string | null {
  try {
    return new URL(subscriptionUrl.trim()).searchParams.get('data');
  } catch {
    return null;
  }
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((s) => typeof s === 'string');

/** 数据来自 URL，任何人都能构造，前后端共用这一道结构校验 */
export function validateSubscriptionData(raw: unknown): SubscriptionData {
  const data = raw as SubscriptionData;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid subscription data structure');
  }
  if (!isStringArray(data.links)) {
    throw new Error('Invalid subscription data structure');
  }
  if (data.upstreams !== undefined && !isStringArray(data.upstreams)) {
    throw new Error('Invalid upstreams');
  }
  if (typeof data.template !== 'string' || !ruleTemplates[data.template]) {
    throw new Error(`Unknown rule template: ${data.template}`);
  }
  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length > 64)) {
    throw new Error('Invalid name');
  }
  if (data.userinfo !== undefined) {
    const { total, expire } = data.userinfo;
    const ok = (n: unknown) => n === undefined || (typeof n === 'number' && Number.isFinite(n) && n >= 0);
    if (!ok(total) || !ok(expire)) throw new Error('Invalid userinfo');
  }
  if (data.links.length === 0 && !data.upstreams?.length) {
    throw new Error('No proxy links or upstreams');
  }
  return data;
}
