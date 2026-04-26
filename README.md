# SubCraft

无状态的代理订阅转换服务。

## 功能特点

- 🔒 **完全无状态**：不存储任何用户数据，所有信息编码在 URL 中
- 🚀 **实时生成**：动态解析代理链接并生成订阅配置
- 🔌 **多协议支持**：支持 vless、vmess、trojan 等多种协议
- ⚙️ **自定义规则**：支持配置代理、直连、拦截规则
- 🎯 **多客户端**：支持 Clash、Surge、Quantumult X 等客户端
- 🎨 **现代化界面**：基于 Vite 5 + React 19 + Tailwind CSS v4

## 工作原理

```
用户输入代理链接 + 规则配置
    ↓
前端编码（Base64 + 压缩）
    ↓
生成订阅 URL: /api/sub/{encoded_data}
    ↓
客户端请求该 URL
    ↓
后端解码 → 解析链接 → 添加规则 → 生成配置
    ↓
返回给客户端
```

## 技术栈

- Vite 5 + React 19 + TypeScript
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

1. 在首页输入一个或多个代理链接（每行一个）
2. 选择目标客户端类型（Clash / Surge / Quantumult X）
3. 配置代理规则（可选）
4. 点击"生成订阅链接"
5. 复制生成的订阅 URL
6. 在对应客户端中添加该订阅链接

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
│   ├── components/
│   │   ├── SubscriptionForm.tsx
│   │   └── ThemeSwitcher.tsx
│   ├── lib/                      # 仅前端使用（theme, utils）
│   ├── shared/                   # 前后端共享
│   │   ├── encoder.ts
│   │   ├── parsers/
│   │   ├── generators/
│   │   ├── rules.ts
│   │   └── types.ts
│   └── styles/globals.css
├── functions/
│   └── api/sub.ts                # CF Pages Function
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
