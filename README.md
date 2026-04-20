# SubCraft

无状态的 Vless 到 Clash 订阅转换服务。

## 功能特点

- 🔒 **完全无状态**：不存储任何用户数据，所有信息编码在 URL 中
- 🚀 **实时生成**：动态解析 vless 链接并生成 Clash 配置
- ⚙️ **自定义规则**：支持配置代理、直连、拦截规则
- 🎨 **现代化界面**：基于 Next.js 16 + React 19 + Tailwind CSS v4

## 工作原理

```
用户输入 vless 链接 + 规则配置
    ↓
前端编码（Base64 + 压缩）
    ↓
生成订阅 URL: /api/sub/{encoded_data}
    ↓
Clash 客户端请求该 URL
    ↓
后端解码 → 解析 vless → 添加规则 → 生成 Clash YAML
    ↓
返回给 Clash 客户端
```

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui 组件
- Docker 部署
- GitHub Actions CI/CD (GHCR)

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
GITHUB_OWNER=xiangyu-labs
PROJECT_NAME=subcraft
IMAGE=ghcr.io/${GITHUB_OWNER}/${PROJECT_NAME}
DOMAIN=sub.yourdomain.com
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
TZ=Asia/Shanghai
```

> **注意**：`GITHUB_OWNER` 和 `PROJECT_NAME` 必须全部使用**小写字母**。

### 4. 本地开发

```bash
npm run dev
```

访问 `http://localhost:3000`

## 使用方法

1. 在首页输入一个或多个 vless 链接（每行一个）
2. 配置代理规则（可选）
3. 点击"生成订阅链接"
4. 复制生成的订阅 URL
5. 在 Clash 客户端中添加该订阅链接

## Docker 部署

### 本地构建运行

```bash
docker compose up --build
```

### 生产部署（带 Traefik + Watchtower）

确保已创建外部网络：

```bash
docker network create server-internal-net
```

部署：

```bash
docker compose up -d
```

## CI/CD

GitHub Actions 自动构建并推送 Docker 镜像到 GHCR。

镜像地址：`ghcr.io/xiangyu-labs/subcraft`

### 所需配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中配置：

- **Variables**: `NEXT_PUBLIC_APP_URL`
- **Secrets**: `GITHUB_TOKEN`（默认已有）

## 项目结构

```
.
├── src/
│   ├── app/
│   │   ├── page.tsx              # 首页：输入表单
│   │   ├── layout.tsx            # 全局布局
│   │   └── api/
│   │       ├── generate/         # 生成订阅链接 API
│   │       └── sub/[encoded]/    # 返回 Clash 配置 API
│   ├── components/
│   │   └── ui/                   # shadcn/ui 组件
│   └── lib/
│       ├── vless-parser.ts       # vless 链接解析
│       ├── clash-generator.ts    # Clash 配置生成
│       ├── encoder.ts            # 数据编码/解码
│       └── rules.ts              # 预设规则
├── .github/workflows/            # CI/CD
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run tsc` | TypeScript 类型检查 |

## License

MIT
