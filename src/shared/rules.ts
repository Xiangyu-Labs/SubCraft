export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  ruleUrls?: Record<string, string>;
  rules: string[];
}

/**
 * 规则集上游。客户端不直接访问这些地址——SubCraft 通过 /api/ruleset/:name
 * 代理并做边缘缓存，这样手机只需要能访问订阅本身的域名。
 *
 * testingcf 走 Cloudflare 线路，比 cdn.jsdelivr.net 在国内稳定。
 */
export const RULE_SOURCES: Record<string, string> = {
  proxy: 'https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
  direct: 'https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
  reject: 'https://testingcf.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
};

const urls = (...names: Array<keyof typeof RULE_SOURCES>) =>
  Object.fromEntries(names.map((n) => [n, RULE_SOURCES[n]]));

export const ruleTemplates: Record<string, RuleTemplate> = {
  blacklist: {
    id: 'blacklist',
    name: '黑名单模式',
    description: '仅代理被墙网站，其余直连',
    ruleUrls: urls('proxy'),
    rules: [
      'RULE-SET,proxy,PROXY',
      'GEOIP,CN,DIRECT,no-resolve',
      'MATCH,DIRECT',
    ],
  },

  'blacklist-adguard': {
    id: 'blacklist-adguard',
    name: '黑名单 + AdGuard',
    description: '仅代理被墙网站 + 广告拦截，其余直连',
    ruleUrls: urls('reject', 'proxy'),
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,proxy,PROXY',
      'GEOIP,CN,DIRECT,no-resolve',
      'MATCH,DIRECT',
    ],
  },

  whitelist: {
    id: 'whitelist',
    name: '白名单模式',
    description: '仅直连国内网站，其余代理',
    ruleUrls: urls('direct'),
    rules: [
      'RULE-SET,direct,DIRECT',
      'GEOIP,CN,DIRECT,no-resolve',
      'MATCH,PROXY',
    ],
  },

  'whitelist-adguard': {
    id: 'whitelist-adguard',
    name: '白名单 + AdGuard',
    description: '仅直连国内网站 + 广告拦截',
    ruleUrls: urls('reject', 'direct'),
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,direct,DIRECT',
      'GEOIP,CN,DIRECT,no-resolve',
      'MATCH,PROXY',
    ],
  },

  'reverse-blacklist': {
    id: 'reverse-blacklist',
    name: '回国黑名单',
    description: '仅代理国内网站回国，其余海外直连',
    ruleUrls: urls('direct'),
    rules: [
      'RULE-SET,direct,PROXY',
      'GEOIP,CN,PROXY,no-resolve',
      'MATCH,DIRECT',
    ],
  },

  'reverse-blacklist-adguard': {
    id: 'reverse-blacklist-adguard',
    name: '回国黑名单 + AdGuard',
    description: '仅代理国内网站回国 + 广告拦截',
    ruleUrls: urls('reject', 'direct'),
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,direct,PROXY',
      'GEOIP,CN,PROXY,no-resolve',
      'MATCH,DIRECT',
    ],
  },

  'reverse-whitelist': {
    id: 'reverse-whitelist',
    name: '回国白名单',
    description: '仅海外直连，其余代理回国',
    ruleUrls: urls('proxy'),
    rules: [
      'RULE-SET,proxy,DIRECT',
      'GEOIP,CN,PROXY,no-resolve',
      'MATCH,PROXY',
    ],
  },

  'reverse-whitelist-adguard': {
    id: 'reverse-whitelist-adguard',
    name: '回国白名单 + AdGuard',
    description: '仅海外直连 + 广告拦截',
    ruleUrls: urls('reject', 'proxy'),
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,proxy,DIRECT',
      'GEOIP,CN,PROXY,no-resolve',
      'MATCH,PROXY',
    ],
  },
};
