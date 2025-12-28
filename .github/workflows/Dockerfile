# ============================================
# 依赖阶段
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# 启用 corepack（用于管理包管理器版本）
RUN corepack enable

# 复制包管理文件
COPY package.json pnpm-lock.yaml* ./

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

# 从依赖阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules
# 复制所有源代码
COPY . .

# ============================================
# 构建参数
# 仅声明构建时需要的变量
# ============================================

# NEXT_PUBLIC_* 变量（会被嵌入到客户端 JavaScript 中）
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PRICING_PATH
ARG NEXT_PUBLIC_OPTIMIZED_IMAGES
ARG NEXT_PUBLIC_LOGIN_MODE
ARG NEXT_PUBLIC_GITHUB_CLIENT_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_ENABLE_STRIPE
ARG NEXT_PUBLIC_DEFAULT_CURRENCY
ARG NEXT_PUBLIC_GOOGLE_ID
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN
ARG NEXT_PUBLIC_PLAUSIBLE_SRC
ARG NEXT_PUBLIC_DISCORD_INVITE_URL
ARG NEXT_PUBLIC_AUTO_FILL_AI_PROVIDER
ARG NEXT_PUBLIC_AUTO_FILL_AI_MODEL_ID
ARG NEXT_PUBLIC_DAILY_AI_AUTO_FILL_LIMIT
ARG NEXT_PUBLIC_DAILY_SUBMIT_LIMIT
ARG NEXT_PUBLIC_DAILY_IMAGE_UPLOAD_LIMIT

# R2_PUBLIC_URL 被 next.config.mjs 用于配置图片远程模式
ARG R2_PUBLIC_URL

# DATABASE_URL 在构建时用于静态站点生成（SSG）
ARG DATABASE_URL

# ============================================
# 构建环境变量
# ============================================

# 将 NEXT_PUBLIC_* 设置为环境变量，以便 Next.js 可以将它们嵌入到打包文件中
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_PRICING_PATH=${NEXT_PUBLIC_PRICING_PATH}
ENV NEXT_PUBLIC_OPTIMIZED_IMAGES=${NEXT_PUBLIC_OPTIMIZED_IMAGES}
ENV NEXT_PUBLIC_LOGIN_MODE=${NEXT_PUBLIC_LOGIN_MODE}
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=${NEXT_PUBLIC_GITHUB_CLIENT_ID}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=${NEXT_PUBLIC_TURNSTILE_SITE_KEY}
ENV NEXT_PUBLIC_ENABLE_STRIPE=${NEXT_PUBLIC_ENABLE_STRIPE}
ENV NEXT_PUBLIC_DEFAULT_CURRENCY=${NEXT_PUBLIC_DEFAULT_CURRENCY}
ENV NEXT_PUBLIC_GOOGLE_ID=${NEXT_PUBLIC_GOOGLE_ID}
ENV NEXT_PUBLIC_PLAUSIBLE_DOMAIN=${NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
ENV NEXT_PUBLIC_PLAUSIBLE_SRC=${NEXT_PUBLIC_PLAUSIBLE_SRC}
ENV NEXT_PUBLIC_DISCORD_INVITE_URL=${NEXT_PUBLIC_DISCORD_INVITE_URL}
ENV NEXT_PUBLIC_AUTO_FILL_AI_PROVIDER=${NEXT_PUBLIC_AUTO_FILL_AI_PROVIDER}
ENV NEXT_PUBLIC_AUTO_FILL_AI_MODEL_ID=${NEXT_PUBLIC_AUTO_FILL_AI_MODEL_ID}
ENV NEXT_PUBLIC_DAILY_AI_AUTO_FILL_LIMIT=${NEXT_PUBLIC_DAILY_AI_AUTO_FILL_LIMIT}
ENV NEXT_PUBLIC_DAILY_SUBMIT_LIMIT=${NEXT_PUBLIC_DAILY_SUBMIT_LIMIT}
ENV NEXT_PUBLIC_DAILY_IMAGE_UPLOAD_LIMIT=${NEXT_PUBLIC_DAILY_IMAGE_UPLOAD_LIMIT}

# 为 next.config.mjs 设置 R2_PUBLIC_URL
ENV R2_PUBLIC_URL=${R2_PUBLIC_URL}

# 为静态站点生成设置 DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

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
