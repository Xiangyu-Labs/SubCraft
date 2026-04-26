// 代理协议类型
export type ProxyProtocol = 'vless' | 'vmess' | 'trojan' | 'ss';

// 规则模板 ID
export type RuleTemplate = 'minimal' | 'balanced' | 'global' | 'pure';

// 客户端类型
export type ClientType = 'clash';

// Clash 基础配置选项
export interface ClashBaseConfig {
  mixedPort: number;
  allowLan: boolean;
  mode: 'rule' | 'global' | 'direct';
  logLevel: 'info' | 'warning' | 'error' | 'debug' | 'silent';
  ipv6: boolean;
}

// Clash DNS 配置选项
export interface ClashDNSOptions {
  enable: boolean;
  ipv6: boolean;
  enhancedMode: 'fake-ip' | 'redir-host';
  fakeIpRange: string;
  fakeIpFilter: string[];
  nameserver: string[];
  fallback: string[];
}

// 订阅数据结构
export interface SubscriptionData {
  links: string[];           // 代理链接数组
  template: RuleTemplate;    // 规则模板
  client: ClientType;        // 客户端类型
  baseConfig?: ClashBaseConfig;  // 可选，有默认值
  dnsOptions?: ClashDNSOptions;  // 可选，有默认值
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
  // Reality 协议
  fingerprint?: string;
  publicKey?: string;
  shortId?: string;
  // 其他
  allowInsecure?: boolean;
  serviceName?: string;
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
  'client-fingerprint'?: string;
  'reality-opts'?: {
    'public-key': string;
    'short-id'?: string;
  };
  'grpc-opts'?: {
    'grpc-service-name'?: string;
    'grpc-mode'?: string;
  };
  'ws-opts'?: {
    path?: string;
    headers?: Record<string, string>;
  };
}

// DNS 配置（用于 YAML 生成）
export interface ClashDNSConfig {
  enable: boolean;
  ipv6: boolean;
  'enhanced-mode': 'fake-ip' | 'redir-host';
  'fake-ip-range': string;
  'fake-ip-filter': string[];
  nameserver: string[];
  fallback: string[];
  'fallback-filter': {
    geoip: boolean;
    'geoip-code': string;
    ipcidr: string[];
  };
}

// Clash 配置
export interface ClashConfig {
  'mixed-port': number;
  'allow-lan': boolean;
  mode: 'rule' | 'global' | 'direct';
  'log-level': 'info' | 'warning' | 'error' | 'debug' | 'silent';
  ipv6: boolean;
  dns: ClashDNSConfig;
  proxies: ClashProxy[];
  'proxy-groups': Array<{
    name: string;
    type: string;
    proxies: string[];
  }>;
  rules: string[];
}
