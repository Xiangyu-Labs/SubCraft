// 代理协议类型
export type ProxyProtocol = 'vless' | 'vmess' | 'trojan' | 'ss';

// 规则模板 ID
export type RuleTemplate = 'minimal' | 'balanced' | 'global';

// 客户端类型
export type ClientType = 'clash';

// 订阅数据结构
export interface SubscriptionData {
  links: string[];           // 代理链接数组
  template: RuleTemplate;    // 规则模板
  client: ClientType;        // 客户端类型
}

// Vless 节点配置
export interface VlessNode {
  name: string;
  server: string;
  port: number;
  uuid: string;
  network?: string;
  tls?: boolean;
  sni?: string;
  alpn?: string;
  flow?: string;
  wsPath?: string;
  wsHost?: string;
}

// Clash 代理节点
export interface ClashProxy {
  name: string;
  type: string;
  server: string;
  port: number;
  uuid?: string;
  password?: string;
  cipher?: string;
  network?: string;
  tls?: boolean;
  'skip-cert-verify'?: boolean;
  servername?: string;
  'ws-opts'?: {
    path?: string;
    headers?: Record<string, string>;
  };
}

// Clash 配置
export interface ClashConfig {
  proxies: ClashProxy[];
  'proxy-groups': Array<{
    name: string;
    type: string;
    proxies: string[];
  }>;
  'rule-providers'?: Record<string, {
    type: string;
    behavior: string;
    url: string;
    interval: number;
  }>;
  rules: string[];
}
