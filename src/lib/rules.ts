export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  ruleProviders?: Record<string, {
    type: string;
    behavior: string;
    url: string;
    interval: number;
  }>;
  rules: string[];
}

export const ruleTemplates: Record<string, RuleTemplate> = {
  minimal: {
    id: 'minimal',
    name: '最小规则',
    description: '仅代理被墙网站',
    ruleProviders: {
      gfw: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt',
        interval: 86400,
      },
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
    ruleProviders: {
      reject: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
        interval: 86400,
      },
      proxy: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
        interval: 86400,
      },
      direct: {
        type: 'http',
        behavior: 'domain',
        url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
        interval: 86400,
      },
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
};
