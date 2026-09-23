import type { ProxyNode } from '../types';
import { base64ToUtf8 } from '../base64';
import { parseVlessLink } from './vless';
import { parseVmessLink } from './vmess';
import { parseTrojanLink } from './trojan';
import { parseSsLink } from './ss';
import { parseHysteria2Link } from './hysteria2';
import { parseTuicLink } from './tuic';

export { parseVlessLink, parseVmessLink, parseTrojanLink, parseSsLink, parseHysteria2Link, parseTuicLink };

const PARSERS: Array<[RegExp, (link: string) => ProxyNode]> = [
  [/^vless:\/\//i, parseVlessLink],
  [/^vmess:\/\//i, parseVmessLink],
  [/^trojan:\/\//i, parseTrojanLink],
  [/^ss:\/\//i, parseSsLink],
  [/^(hysteria2|hy2):\/\//i, parseHysteria2Link],
  [/^tuic:\/\//i, parseTuicLink],
];

export const SUPPORTED_SCHEMES = ['vless', 'vmess', 'trojan', 'ss', 'hysteria2', 'hy2', 'tuic'];

export function parseProxyLink(link: string): ProxyNode {
  const trimmed = link.trim();
  for (const [re, parse] of PARSERS) {
    if (re.test(trimmed)) {
      // scheme 统一成小写，各解析器只认小写前缀
      return parse(trimmed.replace(re, (s) => s.toLowerCase()));
    }
  }
  const scheme = trimmed.match(/^([a-z0-9+.-]+):\/\//i)?.[1];
  throw new Error(scheme ? `不支持的协议 ${scheme}` : '不是代理链接');
}

export function isUpstreamUrl(line: string): boolean {
  return /^https?:\/\//i.test(line.trim());
}

/** 有人会把面板里带 scheme 的地址整段粘进 userinfo 后面，如 vless://id@https://host:443 */
export function normalizeLinkLine(line: string): string {
  return line.trim().replace(/@(https?:\/\/)/, '@');
}

export type LinkEntry =
  | { line: number; kind: 'node'; raw: string; node: ProxyNode }
  | { line: number; kind: 'upstream'; raw: string }
  | { line: number; kind: 'error'; raw: string; message: string };

export interface ParsedLinkList {
  entries: LinkEntry[];
  nodes: ProxyNode[];
  /** 代理链接原文（与 nodes 一一对应），编码进订阅时使用 */
  links: string[];
  upstreams: string[];
  errors: Array<{ line: number; message: string }>;
}

/** 解析用户输入 / 上游返回的多行文本。http(s):// 开头的行视为上游订阅地址 */
export function parseLinkList(text: string, { allowUpstreams = true } = {}): ParsedLinkList {
  const result: ParsedLinkList = { entries: [], nodes: [], links: [], upstreams: [], errors: [] };

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = i + 1;
    const raw = normalizeLinkLine(rawLine);
    if (!raw || raw.startsWith('#') || raw.startsWith('//')) return;

    if (isUpstreamUrl(raw)) {
      if (allowUpstreams) {
        result.entries.push({ line, kind: 'upstream', raw });
        result.upstreams.push(raw);
      } else {
        const message = '不能在上游订阅里嵌套订阅地址';
        result.entries.push({ line, kind: 'error', raw, message });
        result.errors.push({ line, message });
      }
      return;
    }

    try {
      const node = parseProxyLink(raw);
      result.entries.push({ line, kind: 'node', raw, node });
      result.nodes.push(node);
      result.links.push(raw);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.entries.push({ line, kind: 'error', raw, message });
      result.errors.push({ line, message });
    }
  });

  return result;
}

/**
 * 上游订阅的响应体：v2rayN 风格的 base64 链接列表，或明文逐行链接。
 * Clash YAML 不在支持范围内——请求时带的 UA 会让主流面板返回链接列表。
 */
export function decodeSubscriptionBody(body: string): string {
  const text = body.replace(/^\uFEFF/, '').trim();
  if (/:\/\//.test(text.split(/\r?\n/, 1)[0])) {
    return text;
  }
  if (/^\s*(proxies|mixed-port|port|dns|proxy-groups)\s*:/m.test(text)) {
    throw new Error('上游返回的是 Clash YAML，暂不支持');
  }
  let decoded: string;
  try {
    decoded = base64ToUtf8(text);
  } catch {
    throw new Error('上游订阅内容无法识别');
  }
  if (!/:\/\//.test(decoded)) {
    throw new Error('上游订阅内容无法识别');
  }
  return decoded;
}
