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

需要 **Node.js 22+**（CI / Docker 构建用 22；本机 22 或 24 均可）。
Docker 镜像里的包管理器钉死 **pnpm 9**（和 CI 的 `pnpm/action-setup` 一致）。不要在 Dockerfile 里写无版本的 `npm install -g pnpm`：pnpm 10/11 会拦截 `@parcel/watcher`、`esbuild`、`vue-demi` 的构建脚本，安装以 `ERR_PNPM_IGNORED_BUILDS` 失败。

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

## Playground

登录后可在「对话」页聊天。左侧是历史（手机点「历史对话」）；Agent / 模型 / 温度等点右上角「参数」。每轮结束后会保存，刷新还能打开。

## Constraints

- 不改工作流 Vue Flow 核心逻辑
- 导航模块与权限与现网一致
- 尽量不改 Dockerfile / nginx / GitHub Actions
- 手机端：可登录、可浏览；工作流编辑以桌面为主
