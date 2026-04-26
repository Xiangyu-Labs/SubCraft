export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  ruleUrls?: Record<string, string>;  // 规则URL，服务端下载用
  rules: string[];
}

export const ruleTemplates: Record<string, RuleTemplate> = {
  minimal: {
    id: 'minimal',
    name: '最小规则',
    description: '仅代理被墙网站',
    ruleUrls: {
      gfw: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt',
    },
    rules: [
      'RULE-SET,gfw,PROXY',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  balanced: {
    id: 'balanced',
    name: '均衡模式',
    description: '广告拦截 + 智能分流（推荐）',
    ruleUrls: {
      reject: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
      proxy: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
      direct: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
    },
    rules: [
      'RULE-SET,reject,REJECT',
      'RULE-SET,proxy,PROXY',
      'RULE-SET,direct,DIRECT',
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  global: {
    id: 'global',
    name: '全局代理',
    description: '所有流量走代理，除了中国 IP',
    rules: [
      'GEOIP,CN,DIRECT',
      'MATCH,PROXY',
    ],
  },

  pure: {
    id: 'pure',
    name: '纯净模式',
    description: '所有流量走代理，无任何规则',
    rules: [
      'MATCH,PROXY',
    ],
  },
};
