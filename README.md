# CogniForge Web

CogniForge 前端控制台。

## Tech Stack

- Nuxt **4** + Vue 3 + Pinia + TypeScript
- **Nuxt UI 4** + Tailwind CSS 4（壳 / 导航 / Chat / 业务页）
- Vue Flow（工作流画布，引擎不变）

## 主题

Aurora（默认）/ Ink Night / Citrus / Glass — 顶栏调色盘或设置页切换。

## 语言

简体中文 / English。顶栏地球图标、登录页右上角、或设置 → Preferences。选择会记在浏览器里；登录后同步到现有 `PUT /api/v1/settings` 的 `language` 字段。地址栏路径不变。

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

## Constraints

- 不改 API 入参 / 出参
- 不改工作流 Vue Flow 核心逻辑
- 导航模块与权限与现网一致
- 尽量不改 Dockerfile / nginx / GitHub Actions
- 手机端：可登录、可浏览；工作流编辑以桌面为主
