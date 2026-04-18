# Next.js Self-Hosted Template

一个轻量的 Next.js 模板，用于快速搭建可自托管的 Web 应用。

## 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui 组件
- Docker 部署
- GitHub Actions CI/CD (GHCR)

## 快速开始

### 1. 初始化项目

```bash
npx degit xiangyu-labs/nextjs-template my-project
cd my-project
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
PROJECT_NAME=my-project
DOMAIN=app.example.com
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
TZ=Asia/Shanghai
```

密钥写入 `.env.local`（已受 `.gitignore` 保护）：

```
OPENAI_BASE_URL=https://llm.xiangyu.pro/v1
OPENAI_API_KEY=sk-xxx
RESEND_API_KEY=re-xxx
```

### 4. 修改项目标题

创建新项目后，请将以下位置的标题修改为对应的项目名：

| 文件 | 字段 / 位置 | 说明 |
|------|------------|------|
| `src/app/layout.tsx` | `metadata.title` | 浏览器标签页标题 |
| `src/app/page.tsx` | `<h1>` 或页面主标题 | 首页标题 |
| `package.json` | `name` | npm 包名 |
| `README.md` | `#` 标题 | 项目文档标题 |

### 5. 本地开发

```bash
npm run dev
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run tsc` | TypeScript 类型检查 |

## Docker 部署

### 本地构建运行

```bash
docker compose up --build
```

服务默认暴露在 `http://localhost:3000`。

### 生产部署（带 Traefik + Watchtower）

生产环境使用 `docker-compose.override.yml` 叠加配置：

- Traefik 反向代理 + HTTPS 自动证书
- Watchtower 自动更新标签
- 自定义容器名 + 外部网络

确保已创建外部网络：

```bash
docker network create server-internal-net
```

部署：

```bash
docker compose up -d
```

## CI/CD

GitHub Actions 工作流包含两个并行 job：

| Job | 触发条件 | 说明 |
|-----|---------|------|
| `test` | 所有 push / PR | lint + TypeScript 类型检查 |
| `build-and-push` | push 到 main | 构建 Docker 镜像并推送至 GHCR |

镜像地址：`ghcr.io/<owner>/<repo>`，tag 为 `latest` 和短 SHA。

### 所需配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中配置：

- **Variables**: `NEXT_PUBLIC_APP_URL`
- **Secrets**: `GITHUB_TOKEN`（默认已有，无需手动添加）

## 目录结构

```
.
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/
│   │   └── ui/           # shadcn/ui 组件 (button, card, input)
│   └── lib/
│       └── utils.ts      # cn() 工具函数
├── .github/workflows/    # CI/CD
├── docker-compose.yml    # 基础 Docker 配置
├── docker-compose.override.yml  # 生产叠加配置
├── Dockerfile
├── .env.example          # 环境变量模板
├── .env.local            # 本地密钥（gitignore）
└── next.config.ts
```

## 添加 shadcn/ui 组件

```bash
# 如需图标支持，先安装 lucide-react
npm install lucide-react

npx shadcn add button card input
```

## License

MIT
