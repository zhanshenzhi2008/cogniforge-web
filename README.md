# CogniForge Web

Frontend application built with Nuxt 3 + Element Plus.

## Tech Stack

- Nuxt 3
- Vue 3
- Element Plus
- Pinia
- TypeScript

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
API_BASE=http://localhost:8080
```

本地 `pnpm dev` 默认即上述地址。生产镜像构建时 `API_BASE` 应为空，浏览器请求当前域名 `/api/v1/*`，由 Nginx 转发到后端。不要把生产基址写成 `/api`（接口路径已含 `/api/v1`）。
