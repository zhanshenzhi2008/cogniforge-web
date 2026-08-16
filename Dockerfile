# =====================================================================
# 阶段一：构建
# =====================================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
# 必须钉 pnpm 9：CI 也是 9。`pnpm` 最新（10/11）默认拦截依赖构建脚本，
# 会在 nuxt prepare 之后以 ERR_PNPM_IGNORED_BUILDS 失败
#（@parcel/watcher / esbuild / vue-demi）。
RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile

COPY . .
# 静态托管没有运行时 Nuxt 配置；API 基址必须在构建时写入产物。
# 空字符串 = 浏览器请求当前域名 /api/v1/*，由本容器 Nginx 转发到后端。
# 不要写成 /api：接口路径已包含 /api/v1，再拼会变成 /api/api/v1。
ARG API_BASE=
ENV API_BASE=$API_BASE
RUN pnpm build

# =====================================================================
# 阶段二：运行（nginx 静态托管）
# =====================================================================
FROM nginx:alpine

COPY --from=builder /app/.output/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Traefik 通过 HTTP 代理，无需 TLS
CMD ["nginx", "-g", "daemon off;"]
