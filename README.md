# SubCraft

无状态的代理订阅转换服务。

## 功能特点

- 🔒 **完全无状态**：不存储任何用户数据，所有信息编码在 URL 中
- 🚀 **实时生成**：动态解析代理链接并生成订阅配置
- 🔌 **协议支持**：vless（Reality / ws / gRPC / h2 / httpupgrade / xhttp）、vmess、trojan、ss（含 SS2022、simple-obfs）、hysteria2（含端口跳跃）、tuic v5
- 📊 **上游订阅**：可填机场 / 3x-ui / Marzban 的订阅地址，服务端实时拉取节点并把真实流量、到期时间透传给客户端
- ⚙️ **自定义规则**：支持配置代理、直连、拦截规则
- 🎯 **多客户端**：同一个链接通吃 Clash / mihomo（含 ClashMetaForAndroid）与 Shadowrocket，按 User-Agent 自动输出对应格式
- 🧭 **策略组**：多节点时自动附带「自动选择」（url-test）与「故障转移」（fallback）
- 🎨 **现代化界面**：基于 Vite 8 + React 19 + Tailwind CSS v4

## 工作原理

```
用户输入代理链接 / 上游订阅地址 + 规则配置
    ↓
前端实时解析预览，编码（短键 JSON + deflate + base64url）
    ↓
生成订阅 URL: /api/sub?data={encoded_data}
    ↓
客户端请求该 URL
    ↓
后端解码 → 拉取上游订阅 → 解析链接 → 按 UA 选择格式 → 挂载规则集 → 生成配置
    ↓
返回给客户端（附 subscription-userinfo / profile-title 等响应头）
```

## 技术栈

- Vite 8 + React 19 + TypeScript 6
- Tailwind CSS v4
- Cloudflare Pages + Pages Functions
- Wrangler CLI for deploy

## 快速开始

### 1. 克隆项目

```bash
git clone git@github.com:Xiangyu-Labs/SubCraft.git
cd SubCraft
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```
VITE_APP_URL=https://sub.yourdomain.com
```

### 4. 本地开发

两个终端分别运行:

```bash
# 终端 1：Pages Functions
npm run dev:functions

# 终端 2：Vite SPA
npm run dev
```

访问 `http://localhost:5173`

## 使用方法

1. 在首页输入代理链接或上游订阅地址（每行一个，`http(s)://` 开头的行视为上游订阅），下方会实时列出解析结果
2. 选择规则模板；高级配置里可设订阅名称、端口、模式，以及手填总流量 / 到期日期
3. 点击"生成订阅链接"，复制链接或用 Shadowrocket 扫码
4. 要修改时，把已生成的链接粘进顶部的导入框，回填后编辑再重新生成

### 链接长度

节点凭据（UUID、Reality 公钥）是随机数据，压缩不动，所以每个直接粘贴的节点
大约占 80～120 个字符。节点多时建议改填面板 / 机场的订阅地址：链接里只存那一个
地址，长度与节点数量无关，还能拿到真实流量。

### 流量信息

- 有上游订阅：原样透传上游的 `subscription-userinfo`（多个上游时流量求和、到期取最早）
- 没有上游：使用高级配置里手填的总流量 / 到期日期
- 都没有：不发送该响应头（发全 0 会被部分客户端显示成「0 B / 0 B」）

### 格式选择

`?client=clash|shadowrocket` 显式指定 > User-Agent
（含 `Shadowrocket` 输出 .conf，其余输出 Clash YAML）。

## 生成的配置

规则集不会内联进配置（Loyalsoldier 的三份列表合计超过 30 万条），而是通过
`rule-providers` 指向本服务的 `/api/ruleset/:name`，由客户端自行下载并每日更新。
走本服务而不是直连 jsDelivr，是因为 mihomo 首次加载 rule-provider 失败会导致
整份配置拒绝加载，不能把这一步押在第三方 CDN 的可达性上。

DNS 段刻意**不输出 `fallback`**。mihomo 的语义是：`fallback` 非空时，`nameserver`
返回的非 CN 结果会被丢弃、强制改用 `fallback` 的答案（`fallback-filter.geoip`
默认就是 `true`）。境外节点域名必然解析到非 CN IP，于是强依赖 `fallback` 可达 ——
一旦 DoH/DoT 在当前网络被阻断，节点域名就彻底解析不出来。改由
`proxy-server-nameserver` 用本地可直连的明文 UDP DNS 解析节点域名，
方向由规则模板决定（回国模板用境外 DNS）。

## Cloudflare Pages 部署

### 手动部署

```bash
npm run build
npx wrangler pages deploy dist --project-name=subcraft
```

### 自动部署

GitHub Actions 在 main 分支推送时自动 `wrangler pages deploy dist`。
所需 GitHub Secrets：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

GitHub Variables：
- `VITE_APP_URL`

## 项目结构

```
.
├── src/
│   ├── main.tsx                  # SPA 入口
│   ├── App.tsx                   # 根组件
│   ├── components/               # SubscriptionForm 及其子组件
│   ├── lib/                      # 仅前端使用（theme, toast, utils）
│   ├── server/                   # 仅 Functions 使用
│   │   ├── subscription.ts       # 订阅渲染：选格式、合并节点、响应头
│   │   └── upstream.ts           # 拉取上游订阅、解析 userinfo
│   ├── shared/                   # 前后端共享
│   │   ├── encoder.ts            # 链接编码与校验
│   │   ├── parsers/              # 各协议分享链接解析
│   │   ├── generators/           # Clash / Shadowrocket 配置生成
│   │   ├── rules.ts
│   │   └── types.ts
│   └── styles/globals.css
├── functions/
│   └── api/
│       ├── sub.ts                # 订阅入口
│       └── ruleset/[name].ts     # 规则集代理 + 边缘缓存
├── tests/
├── index.html
├── vite.config.ts
├── wrangler.toml
└── package.json
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | Vite SPA 开发服务器 (5173) |
| `npm run dev:functions` | Pages Functions 服务器 (8788) |
| `npm run build` | 生产构建到 `dist/` |
| `npm run preview` | 本地预览生产构建 (3000) |
| `npm run deploy` | 部署到 Cloudflare Pages |
| `npm run lint` | ESLint 检查 |
| `npm run tsc` | TypeScript 类型检查 |
| `npm test` | 运行 vitest |

## License

MIT
