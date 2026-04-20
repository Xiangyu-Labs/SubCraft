# SubCraft

无状态的代理订阅转换服务。

## 功能特点

- 🔒 **完全无状态**：不存储任何用户数据，所有信息编码在 URL 中
- 🚀 **实时生成**：动态解析代理链接并生成订阅配置
- 🔌 **多协议支持**：支持 vless、vmess、trojan 等多种协议
- ⚙️ **自定义规则**：支持配置代理、直连、拦截规则
- 🎯 **多客户端**：支持 Clash、Surge、Quantumult X 等客户端
- 🎨 **现代化界面**：基于 Next.js 16 + React 19 + Tailwind CSS v4

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

1. 在首页输入一个或多个代理链接（每行一个）
2. 选择目标客户端类型（Clash / Surge / Quantumult X）
3. 配置代理规则（可选）
4. 点击"生成订阅链接"
5. 复制生成的订阅 URL
6. 在对应客户端中添加该订阅链接

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
│   │       └── sub/[encoded]/    # 返回订阅配置 API
│   ├── components/
│   │   └── ui/                   # shadcn/ui 组件
│   └── lib/
│       ├── parsers/              # 协议解析器
│       ├── generators/           # 配置生成器
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
