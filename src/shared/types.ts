// 规则模板 ID
export type RuleTemplate =
  | 'blacklist'
  | 'blacklist-adguard'
  | 'whitelist'
  | 'whitelist-adguard'
  | 'reverse-blacklist'
  | 'reverse-blacklist-adguard'
  | 'reverse-whitelist'
  | 'reverse-whitelist-adguard';

// 客户端类型
export type ClientType = 'clash' | 'shadowrocket';

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
  // 解析 nameserver 里域名形式的 DNS 服务器，必须是明文 UDP
  defaultNameserver?: string[];
  // 专门解析代理节点的 server 域名，必须本地直连可达
  proxyServerNameserver?: string[];
  nameserverPolicy?: Record<string, string[]>;
  // 默认不输出：见 src/shared/defaults.ts 的说明
  fallback?: string[];
  useFallbackFilter?: boolean;
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
  packetEncoding?: string;
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
  udp?: boolean;
  'packet-encoding'?: string;
  tls?: boolean;
  'skip-cert-verify'?: boolean;
  servername?: string;
  alpn?: string[];
  'client-fingerprint'?: string;
  flow?: string;
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
  'default-nameserver': string[];
  nameserver: string[];
  'proxy-server-nameserver': string[];
  'nameserver-policy'?: Record<string, string[]>;
  fallback?: string[];
  'fallback-filter'?: {
    geoip: boolean;
    'geoip-code'?: string;
    ipcidr: string[];
  };
}

// 规则集提供者（客户端自行下载，避免把几十万条规则内联进配置）
export interface ClashRuleProvider {
  type: 'http';
  behavior: 'domain' | 'ipcidr' | 'classical';
  format: 'yaml' | 'text';
  url: string;
  path: string;
  interval: number;
}

// Clash 配置
export interface ClashConfig {
  'mixed-port': number;
  'allow-lan': boolean;
  mode: 'rule' | 'global' | 'direct';
  'log-level': 'info' | 'warning' | 'error' | 'debug' | 'silent';
  ipv6: boolean;
  'unified-delay'?: boolean;
  'tcp-concurrent'?: boolean;
  'geodata-mode'?: boolean;
  'geo-auto-update'?: boolean;
  'geo-update-interval'?: number;
  'geox-url'?: {
    geoip: string;
    geosite: string;
    mmdb: string;
  };
  dns: ClashDNSConfig;
  proxies: ClashProxy[];
  'proxy-groups': Array<{
    name: string;
    type: string;
    proxies: string[];
  }>;
  'rule-providers'?: Record<string, ClashRuleProvider>;
  rules: string[];
}

// Shadowrocket 配置（输出为纯文本 .conf）
export type ShadowrocketConfig = string;
