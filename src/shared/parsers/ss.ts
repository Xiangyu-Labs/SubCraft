import type { SsNode } from '../types';
import { base64ToUtf8 } from '../base64';
import { compact, parseName, parsePort, safeDecode, stripBrackets } from './common';

function splitMethodPassword(s: string): [string, string] {
  const i = s.indexOf(':');
  if (i <= 0) throw new Error('ss 链接缺少加密方式或密码');
  return [s.slice(0, i), s.slice(i + 1)];
}

function parsePlugin(node: SsNode, plugin: string | null) {
  if (!plugin) return;
  const [name, ...opts] = safeDecode(plugin).split(';');
  if (name !== 'obfs-local' && name !== 'simple-obfs') {
    throw new Error(`不支持的 ss 插件 ${name}`);
  }
  for (const opt of opts) {
    const [k, v] = opt.split('=');
    if (k === 'obfs' && (v === 'http' || v === 'tls')) node.obfs = v;
    if (k === 'obfs-host') node.obfsHost = v;
  }
  if (!node.obfs) throw new Error('simple-obfs 缺少 obfs 模式');
}

/**
 * 支持两种格式：
 * - SIP002：ss://base64url(method:password)@host:port/?plugin=...#name
 *   （SS2022 允许 userinfo 直接写百分号编码的明文）
 * - 旧式：ss://base64(method:password@host:port)#name
 */
export function parseSsLink(link: string): SsNode {
  if (!link.startsWith('ss://')) {
    throw new Error('Invalid ss link: must start with ss://');
  }

  const hashIndex = link.indexOf('#');
  const name = hashIndex >= 0 ? parseName(link.slice(hashIndex)) : 'Unnamed';
  const body = link.slice('ss://'.length, hashIndex >= 0 ? hashIndex : undefined);

  if (!body.includes('@')) {
    let decoded: string;
    try {
      decoded = base64ToUtf8(body.split('?')[0].replace(/\/$/, ''));
    } catch {
      throw new Error('ss 链接无法解码');
    }
    const at = decoded.lastIndexOf('@');
    const m = decoded.slice(at + 1).match(/^\[?([^\]]+?)\]?:(\d+)$/);
    if (at < 0 || !m) throw new Error('ss 链接格式错误');
    const [cipher, password] = splitMethodPassword(decoded.slice(0, at));
    return { type: 'ss', name, server: m[1], port: parsePort(m[2]), cipher, password };
  }

  let url: URL;
  try {
    url = new URL('ss://' + body);
  } catch (error) {
    throw new Error(`Failed to parse ss link: ${error}`);
  }

  const userinfo = safeDecode(url.username) + (url.password ? ':' + safeDecode(url.password) : '');
  let methodPassword = userinfo;
  if (!userinfo.includes(':')) {
    try {
      methodPassword = base64ToUtf8(userinfo);
    } catch {
      throw new Error('ss 链接的用户信息无法解码');
    }
  }
  const [cipher, password] = splitMethodPassword(methodPassword);

  const node: SsNode = {
    type: 'ss',
    name,
    server: stripBrackets(url.hostname),
    port: parsePort(url.port),
    cipher,
    password,
  };
  parsePlugin(node, url.searchParams.get('plugin'));
  if (!node.server) throw new Error('ss 链接缺少服务器地址');
  return compact(node);
}
