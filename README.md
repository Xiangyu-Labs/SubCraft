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
NEXT_PUBLIC_APP_URL=https://app.example.com
TZ=Asia/Shanghai
```

如有密钥（如 API Key），写入 `.env.local`（已受 `.gitignore` 保护）：

```
OPENAI_BASE_URL=https://llm.xiangyu.pro/v1
OPENAI_API_KEY=sk-xxx
RESEND_API_KEY=re_xxx
```

### 4. 本地开发

```bash
npm run dev
```

## Docker 部署

### 本地构建运行

```bash
docker compose up --build
```

服务默认暴露在 `http://localhost:3000`。

### 生产部署（带 Traefik + Watchtower）

生产环境使用 `docker-compose.override.yml` 叠加配置，包含：

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
│   │   └── ui/           # shadcn/ui 组件
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
npx shadcn add button card input
```

## License

MIT
