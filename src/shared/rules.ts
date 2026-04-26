export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  ruleUrls?: Record<string, string>;
  rules: string[];
}

export const ruleTemplates: Record<string, RuleTemplate> = {
  blacklist: {
    id: 'blacklist',
    name: '黑名单模式',
    description: '仅代理被墙网站，其余直连',
    ruleUrls: {
      proxy: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
    },
    rules: [
      'RULE-SET,proxy,PROXY',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  'blacklist-adguard': {
    id: 'blacklist-adguard',
    name: '黑名单 + AdGuard',
    description: '仅代理被墙网站 + 广告拦截',
    ruleUrls: {
      reject: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      proxy: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
    },
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,proxy,PROXY',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  whitelist: {
    id: 'whitelist',
    name: '白名单模式',
    description: '仅直连国内网站，其余代理',
    ruleUrls: {
      direct: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
    },
    rules: [
      'RULE-SET,direct,DIRECT',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  'whitelist-adguard': {
    id: 'whitelist-adguard',
    name: '白名单 + AdGuard',
    description: '仅直连国内网站 + 广告拦截',
    ruleUrls: {
      reject: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      direct: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
    },
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,direct,DIRECT',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  'reverse-blacklist': {
    id: 'reverse-blacklist',
    name: '回国黑名单',
    description: '仅代理国内网站回国，其余海外直连',
    ruleUrls: {
      direct: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
    },
    rules: [
      'RULE-SET,direct,PROXY',
      'GEOIP,CN,PROXY',
      'MATCH,DIRECT',
    ],
  },

  'reverse-blacklist-adguard': {
    id: 'reverse-blacklist-adguard',
    name: '回国黑名单 + AdGuard',
    description: '仅代理国内网站回国 + 广告拦截',
    ruleUrls: {
      reject: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      direct: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
    },
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,direct,PROXY',
      'GEOIP,CN,PROXY',
      'MATCH,DIRECT',
    ],
  },

  'reverse-whitelist': {
    id: 'reverse-whitelist',
    name: '回国白名单',
    description: '仅海外直连，其余代理回国',
    ruleUrls: {
      proxy: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
    },
    rules: [
      'RULE-SET,proxy,DIRECT',
      'GEOIP,CN,PROXY',
      'MATCH,PROXY',
    ],
  },

  'reverse-whitelist-adguard': {
    id: 'reverse-whitelist-adguard',
    name: '回国白名单 + AdGuard',
    description: '仅海外直连 + 广告拦截',
    ruleUrls: {
      reject: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      proxy: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
    },
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,proxy,DIRECT',
      'GEOIP,CN,PROXY',
      'MATCH,PROXY',
    ],
  },
};
