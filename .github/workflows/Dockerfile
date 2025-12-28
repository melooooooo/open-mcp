# ============================================
# 依赖阶段
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# 启用 corepack（用于管理包管理器版本）
RUN corepack enable

# 复制包管理文件
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY apps/docs/package.json ./apps/docs/
COPY packages/ui/package.json ./packages/ui/
COPY packages/track/package.json ./packages/track/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/fumadocs-blog/package.json ./packages/fumadocs-blog/
COPY packages/github/package.json ./packages/github/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/db/package.json ./packages/db/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/email/package.json ./packages/email/

# 使用缓存挂载预取依赖
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
  pnpm fetch
# 使用缓存挂载安装依赖（冻结锁文件，离线模式）
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
  pnpm install --frozen-lockfile --offline

# ============================================
# 构建阶段
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# 启用 corepack
RUN corepack enable

# 从依赖阶段复制整个目录（包含所有工作区的 node_modules）
COPY --from=deps /app ./
# 复制所有源代码（如果 .dockerignore 配置正确，这会覆盖源码但保留 node_modules）
COPY . .

# ============================================
# 构建参数
# 仅声明构建时需要的变量
# ============================================

# NEXT_PUBLIC_* 变量（会被嵌入到客户端 JavaScript 中）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NODE_ENV
ARG DATABASE_URL
ARG R2_BUCKET_NAME
ARG R2_ACCOUNT_ID
ARG R2_PUBLIC_URL
ARG R2_ACCESS_KEY_ID
ARG R2_SECRET_ACCESS_KEY
ARG BETTER_AUTH_SECRET
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG RESEND_API_KEY
ARG RESEND_FROM
ARG BETTER_AUTH_URL

ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NODE_ENV=${NODE_ENV}
ENV DATABASE_URL=${DATABASE_URL}
ENV R2_BUCKET_NAME=${R2_BUCKET_NAME}
ENV R2_ACCOUNT_ID=${R2_ACCOUNT_ID}
ENV R2_PUBLIC_URL=${R2_PUBLIC_URL}
ENV R2_ACCESS_KEY_ID=${R2_ACCESS_KEY_ID}
ENV R2_SECRET_ACCESS_KEY=${R2_SECRET_ACCESS_KEY}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV RESEND_FROM=${RESEND_FROM}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}

# 禁用 Next.js 遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 构建应用程序
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/v3 \
  pnpm build

# ============================================
# 运行阶段
# ============================================
FROM node:20-alpine AS runner
WORKDIR /app

# ============================================
# 此处不需要构建参数或环境变量
# 所有运行时密钥将由容器运行时（dokploy）注入
# Next.js standalone 模式在运行时读取环境变量
# ============================================

# 设置生产环境
ENV NODE_ENV=production
# 禁用 Next.js 遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 创建系统用户组和用户（用于安全运行）
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 从构建阶段复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置端口和主机名
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用程序
CMD ["node", "server.js"]
