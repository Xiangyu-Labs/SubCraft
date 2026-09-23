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

// 手填的订阅信息（没有上游订阅时写进 subscription-userinfo）
export interface ManualUserinfo {
  total?: number;   // 字节
  expire?: number;  // Unix 秒
}

// 订阅数据结构
export interface SubscriptionData {
  links: string[];           // 代理链接数组
  upstreams?: string[];      // 上游订阅地址，由服务端拉取并透传流量信息
  template: RuleTemplate;    // 规则模板
  name?: string;             // 订阅名称，客户端里显示
  baseConfig?: ClashBaseConfig;  // 可选，有默认值
  dnsOptions?: ClashDNSOptions;  // 可选，有默认值
  userinfo?: ManualUserinfo;
}

export type ProxyType = 'vless' | 'vmess' | 'trojan' | 'ss' | 'hysteria2' | 'tuic';

export type TransportNetwork =
  | 'tcp'
  | 'ws'
  | 'grpc'
  | 'h2'
  | 'http'
  | 'httpupgrade'
  | 'xhttp';

interface BaseNode {
  name: string;
  server: string;
  port: number;
}

// TLS / Reality，vless、vmess、trojan 共用
export interface TlsOptions {
  tls?: boolean;
  sni?: string;
  alpn?: string;             // 逗号分隔，与分享链接一致
  fingerprint?: string;      // uTLS 指纹
  allowInsecure?: boolean;
  publicKey?: string;        // Reality
  shortId?: string;          // Reality
}

// 传输层，vless、vmess、trojan 共用
export interface TransportOptions {
  network?: TransportNetwork;
  path?: string;             // ws / httpupgrade / h2 / xhttp
  host?: string;             // ws / httpupgrade / h2 / xhttp
  serviceName?: string;      // grpc
  xhttpMode?: string;        // xhttp
}

export interface VlessNode extends BaseNode, TlsOptions, TransportOptions {
  type: 'vless';
  uuid: string;
  flow?: string;
  packetEncoding?: string;
  encryption?: string;       // 非 none 时为 xray 的 VLESS Encryption
}

export interface VmessNode extends BaseNode, TlsOptions, TransportOptions {
  type: 'vmess';
  uuid: string;
  alterId: number;
  cipher: string;
}

export interface TrojanNode extends BaseNode, TlsOptions, TransportOptions {
  type: 'trojan';
  password: string;
}

export interface SsNode extends BaseNode {
  type: 'ss';
  cipher: string;
  password: string;
  // 仅支持 simple-obfs（obfs-local）
  obfs?: 'http' | 'tls';
  obfsHost?: string;
}

export interface Hysteria2Node extends BaseNode {
  type: 'hysteria2';
  password: string;
  sni?: string;
  alpn?: string;
  allowInsecure?: boolean;
  obfs?: string;
  obfsPassword?: string;
  ports?: string;            // 端口跳跃，如 20000-30000
  pinSha256?: string;
}

export interface TuicNode extends BaseNode {
  type: 'tuic';
  uuid: string;
  password: string;
  sni?: string;
  alpn?: string;
  allowInsecure?: boolean;
  congestionControl?: string;
  udpRelayMode?: string;
}

export type ProxyNode =
  | VlessNode
  | VmessNode
  | TrojanNode
  | SsNode
  | Hysteria2Node
  | TuicNode;

// Clash 代理节点：公共字段固定，协议字段按 mihomo 文档原样输出
export interface ClashProxy {
  name: string;
  type: string;
  server: string;
  port: number;
  [key: string]: unknown;
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

export interface ClashProxyGroup {
  name: string;
  type: 'select' | 'url-test' | 'fallback';
  proxies: string[];
  url?: string;
  interval?: number;
  tolerance?: number;
  lazy?: boolean;
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
  'proxy-groups': ClashProxyGroup[];
  'rule-providers'?: Record<string, ClashRuleProvider>;
  rules: string[];
}

// Shadowrocket 配置（输出为纯文本 .conf）
export type ShadowrocketConfig = string;
