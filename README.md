# CogniForge Web

CogniForge 前端控制台。

## Tech Stack

**当前运行时（迁移中）**
- Nuxt **4** + Vue 3 + Pinia + TypeScript
- **Nuxt UI 4** + Tailwind CSS 4（壳 / 导航 / 主题）
- Naive UI（业务页过渡期，P5 移除）
- Vue Flow（工作流画布，引擎不变）

**主题（设置页后续接入切换）**
- Aurora（默认）/ Ink Night / Citrus / Glass

## Getting Started

```bash
pnpm install
pnpm dev
pnpm build
```

## Environment Variables

Copy `.env.example` to `.env`:

```
API_BASE=http://localhost:8080
```

本地默认打本机后端；生产镜像 `API_BASE` 为空，走同源 `/api/v1/*`。

## Constraints（UI 迁移期间）

- 不改 API 入参 / 出参
- 不改工作流 Vue Flow 核心逻辑
- 导航模块与权限与现网一致
- 尽量不改 Dockerfile / nginx / GitHub Actions

设计文档：`cogniforge/docs/05-frontend/03-ui-redesign-shadcn.md`
