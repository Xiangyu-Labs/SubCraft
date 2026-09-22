import type { ClashBaseConfig, ClashDNSOptions, RuleTemplate } from './types';

/**
 * geox 数据库镜像。mihomo 默认源在 GitHub，国内直连必失败，而数据库缺失会让
 * GEOIP 规则解析失败、整份配置拒绝加载。testingcf 走 Cloudflare 线路，比
 * cdn.jsdelivr.net 在国内稳定。
 */
export const GEOX_MIRROR = 'https://testingcf.jsdelivr.net';

/**
 * default-nameserver 与 proxy-server-nameserver 只能填明文 UDP:53 的 IP。
 * 填 DoH/DoT 会形成死锁——解析 DNS 服务器自身的域名又需要一次解析。
 */
export const CN_UDP_DNS = ['223.5.5.5', '119.29.29.29'];
export const INTL_UDP_DNS = ['1.1.1.1', '8.8.8.8'];

export const DEFAULT_BASE_CONFIG: ClashBaseConfig = {
  mixedPort: 7890,
  allowLan: false,
  mode: 'rule',
  logLevel: 'info',
  ipv6: false,
};

export const DEFAULT_FAKE_IP_FILTER = [
  '*.lan',
  '*.localdomain',
  '*.example',
  '*.invalid',
  '*.localhost',
  '*.test',
  '*.local',
  '*.home.arpa',
  'time.*.com',
  'time.*.gov',
  'time.*.edu.cn',
  'time.*.apple.com',
  'time1.*.com',
  'time2.*.com',
  'time3.*.com',
  'time4.*.com',
  'time5.*.com',
  'time6.*.com',
  'time7.*.com',
  'ntp.*.com',
  'ntp1.*.com',
  'ntp2.*.com',
  'ntp3.*.com',
  'ntp4.*.com',
  'ntp5.*.com',
  'ntp6.*.com',
  'ntp7.*.com',
  '*.time.edu.cn',
  '*.ntp.org.cn',
  '+.pool.ntp.org',
  'time1.cloud.tencent.com',
  '+.msftconnecttest.com',
  '+.msftncsi.com',
  'localhost.ptlogin2.qq.com',
  '+.srv.nintendo.net',
  '+.stun.*.*',
];

/** 判断是否为回国方向的模板——这类用户人在境外，国内 DNS 对他们又慢又可能不通 */
export function isReverseTemplate(template: RuleTemplate): boolean {
  return template.startsWith('reverse-');
}

/** 该模板方向下，本地可直连的明文 UDP DNS */
export function localDnsFor(template: RuleTemplate): string[] {
  return isReverseTemplate(template) ? [...INTL_UDP_DNS] : [...CN_UDP_DNS];
}

/**
 * 刻意不设 fallback / useFallbackFilter。
 *
 * fake-ip 模式下走代理的域名拿到的是假 IP、真实解析在代理服务器那端完成，
 * fallback 的防污染作用已经失效；而 mihomo 的语义是「fallback 非空时，
 * nameserver 返回的非 CN 结果一律丢弃、强制改用 fallback 的答案」
 * （fallback-filter.geoip 默认就是 true，删掉该段也关不掉）。
 * 境外节点域名必然解析到非 CN IP，于是强依赖 fallback 可达——国内 1.1.1.1
 * 被阻断时整个解析链路直接断掉。fallback 只贡献故障模式，不贡献收益。
 */
export function dnsDefaultsFor(template: RuleTemplate): ClashDNSOptions {
  const local = localDnsFor(template);
  return {
    enable: true,
    ipv6: false,
    enhancedMode: 'fake-ip',
    fakeIpRange: '198.18.0.1/16',
    fakeIpFilter: [...DEFAULT_FAKE_IP_FILTER],
    defaultNameserver: [...local],
    nameserver: [...local],
    proxyServerNameserver: [...local],
  };
}

const PLAIN_UDP_IP = /^(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?$/;

/**
 * dnsOptions 可以由调用方经 URL 传入，所以这里兜底：补齐缺省字段，并保证
 * 两个引导用的解析器槽位是明文 UDP——填 DoH/DoT 会死锁。
 */
export function normalizeDnsOptions(
  raw: Partial<ClashDNSOptions> | undefined,
  template: RuleTemplate,
): ClashDNSOptions {
  const defaults = dnsDefaultsFor(template);
  const o: ClashDNSOptions = { ...defaults, ...(raw ?? {}) };

  const plain = (list?: string[]) => (list ?? []).filter((s) => PLAIN_UDP_IP.test(s));
  const pick = (list?: string[]) => {
    const kept = plain(list);
    return kept.length ? kept : [...defaults.proxyServerNameserver!];
  };
  o.defaultNameserver = pick(o.defaultNameserver);
  o.proxyServerNameserver = pick(o.proxyServerNameserver);

  if (!o.nameserver?.length) {
    o.nameserver = [...defaults.nameserver];
  }
  if (!o.fakeIpFilter?.length) {
    o.fakeIpFilter = [...DEFAULT_FAKE_IP_FILTER];
  }
  if (!o.fallback?.length) {
    delete o.fallback;
    o.useFallbackFilter = false;
  }

  return o;
}
