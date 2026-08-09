# =====================================================================
# 阶段一：构建
# =====================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
# 静态托管没有运行时 Nuxt 配置；同源 API 地址必须在构建时写入产物。
ARG API_BASE=/api
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
