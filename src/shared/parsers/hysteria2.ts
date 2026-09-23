import type { Hysteria2Node } from '../types';
import { compact, isTruthy, parseName, parsePort, safeDecode, stripBrackets } from './common';

const PORT_RANGE = /^[\d,-]+$/;

/** hysteria2://auth@host:port/?sni=&obfs=salamander&obfs-password=&insecure=1#name，hy2:// 同义 */
export function parseHysteria2Link(link: string): Hysteria2Node {
  const m = link.match(/^(hysteria2|hy2):\/\//);
  if (!m) {
    throw new Error('Invalid hysteria2 link: must start with hysteria2:// or hy2://');
  }

  // 端口跳跃可能直接写在地址里（host:20000-30000），URL 解析不了，先摘出来
  let rest = link.slice(m[0].length);
  let ports: string | undefined;
  rest = rest.replace(/^([^/?#]*@)?(\[[^\]]+\]|[^:/?#]+):([\d,-]+)(?=[/?#]|$)/, (all, auth = '', host, portSpec) => {
    if (/^\d+$/.test(portSpec)) return all;
    ports = portSpec;
    return `${auth}${host}:${portSpec.match(/\d+/)![0]}`;
  });

  let url: URL;
  try {
    url = new URL('hysteria2://' + rest);
  } catch (error) {
    throw new Error(`Failed to parse hysteria2 link: ${error}`);
  }
  const params = url.searchParams;

  const mport = params.get('mport');
  if (!ports && mport && PORT_RANGE.test(mport)) ports = mport;

  const password = safeDecode(url.username) + (url.password ? ':' + safeDecode(url.password) : '');
  const obfs = params.get('obfs');

  const node: Hysteria2Node = {
    type: 'hysteria2',
    name: parseName(url.hash),
    server: stripBrackets(url.hostname),
    port: parsePort(url.port),
    password,
    sni: params.get('sni') || params.get('peer') || undefined,
    alpn: params.get('alpn') || undefined,
    allowInsecure: isTruthy(params.get('insecure')) || isTruthy(params.get('allowInsecure')) || undefined,
    obfs: obfs && obfs !== 'none' ? obfs : undefined,
    obfsPassword: params.get('obfs-password') || undefined,
    ports,
    pinSha256: params.get('pinSHA256') || undefined,
  };

  if (!node.server) throw new Error('hysteria2 链接缺少服务器地址');
  if (!node.password) throw new Error('hysteria2 链接缺少密码');
  return compact(node);
}
