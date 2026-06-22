---
description: 
alwaysApply: true
---

# AGENTS.md

High-signal context for OpenCode sessions working in this repo. The codebase is bilingual (Chinese comments/docs, English code).

## Stack

pnpm + Turborepo monorepo. Node >=20, pnpm@10.12.0. Next.js 15 (App Router) + React 19 + tRPC v11 + Drizzle ORM (PostgreSQL) + better-auth. shadcn/ui (new-york) in `packages/ui`.

## Commands

```bash
pnpm install
pnpm dev          # web only, port 30001 (NOT 3000)
pnpm dev:all      # web + docs (docs on port 30002)
pnpm build        # turbo build (all)
pnpm build:web    # @repo/ui#build + web#build (used by Docker/CI)
pnpm lint         # turbo lint
pnpm format       # prettier --write **/*.{ts,tsx,md}

# Per-app (run from root with --filter):
pnpm --filter web typecheck        # tsc --noEmit
pnpm --filter web lint:fix
pnpm --filter docs dev             # port 30002 (script is "check-types", not "typecheck")

# DB (Drizzle) — filter @repo/db:
pnpm --filter @repo/db db:generate  # generate migration from schema.ts
pnpm --filter @repo/db db:migrate   # apply migrations
pnpm --filter @repo/db db:push      # push schema directly (dev only)
pnpm --filter @repo/db db:studio    # drizzle studio
pnpm --filter @repo/db db:seed      # NOTE: hardcodes postgresql://starter:starter@localhost:5432/starter

# BYR referrals automation (tracked scripts):
pnpm referrals:sync    # scrape + upload byr jobs
pnpm byr:boards:sync   # scrape + upload board posts
```

No test runner is configured. `apps/web/e2e/` and `scripts/test-*.ts` exist but are ad-hoc, not a suite.

## Monorepo layout

- `apps/web` — main product (OpenMCP / 银行帮). Next.js App Router, standalone Docker build.
- `apps/docs` — Fumadocs docs + blog. `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are both `true` in its `next.config.mjs`; don't rely on build to catch type errors there.
- `apps/mini-program` — WeChat Mini Program (银行帮). **Not** in pnpm workspace (no `package.json`); edit with WeChat DevTools, appid `wxbb5b6ed8174c6826`.
- `packages/ui` — shadcn/ui components. Import as `@repo/ui/components/<name>`, utils as `@repo/ui/lib/utils`.
- `packages/db` — Drizzle ORM. Exports: `@repo/db` (db client + utils), `@repo/db/schema`, `@repo/db/mcp-schema`, `@repo/db/database/admin`, `@repo/db/database/web`, `@repo/db/usecases/*`, `@repo/db/types`.
- `packages/trpc` — tRPC v11 server. Root router `routers/_app.ts`, split into `routers/admin/*` (adminProcedure) and `routers/web/*` (public/protected). Exports `appRouter` + `AppRouter` type.
- `packages/github`, `packages/email` (React Email + Resend + Nodemailer), `packages/track` (Umami/Baidu), `packages/fumadocs-blog`, `packages/eslint-config`, `packages/typescript-config`.

Workspace packages referenced by `apps/web` must be listed in `transpilePackages` in `apps/web/next.config.mjs`.

## Web app wiring

- **Path alias**: `@/*` → `apps/web/src/*`.
- **Route groups**: `(web)` public marketing pages; `(protected)` → `admin/`, `user/`, `web/` (auth-gated); auth pages at `/auth/*`.
- **Middleware** (`src/middleware.ts`): better-auth cookie check. Protects `/auth/settings`, `/admin/:path*`, `/web/submit`; redirects unauthenticated to `/auth/sign-in?redirectTo=...`. This is optimistic only — real auth enforcement is in tRPC procedures / RSC.
- **Auth**: `src/lib/auth.ts` (better-auth, drizzle adapter, JWT 30d sessions). Plugins: `admin`, `phoneNumber` (Tencent SMS in prod), `emailOTP` (Resend via `@repo/email`). Client: `src/lib/auth-client.ts`. Route handler: `src/app/api/auth/[...all]` (better-auth serves it).
- **tRPC server**: route handler `src/app/api/trpc/[trpc]/route.ts` (`fetchRequestHandler`, `dynamic = "force-dynamic"`). Context from `createContextFromRequest` (`src/lib/trpc/server.ts`) — reads session via `auth.api.getSession`. Procedures: `publicProcedure`, `protectedProcedure` (needs `ctx.user.id`), `adminProcedure` (needs `ctx.user.role === "admin"`).
- **tRPC client**: `src/lib/trpc/client.ts` (`trpc` react + `clientApi`), `links.ts`, wired in `src/app/providers.tsx`. Server-side client (`serverApi`) uses `NEXT_INTERNAL_API_URL` to call `/api/trpc` over HTTP.
- **DB client**: `packages/db/index.ts` uses node-postgres `Pool` with `DATABASE_URL`. A `dbVercel` (Vercel Postgres) instance exists but is **not** exported — `db = dbNode` always.
- **DB access split**: `packages/db/database/admin/` and `packages/db/database/web/` hold query/usecase functions per domain; routers call these rather than writing raw Drizzle queries inline.
- **Other API routes**: `api/webhook/{daily,weekly,monthly,vercel,wework}` (cron/webhook receivers), `api/experiences`, `api/assets`, `api/mp` (mini-program backend), `api/user`, `api/health`, `api/debug-env`.
- **Inngest**: client `packages/trpc/lib/inngest/client.ts`; handler + functions in `apps/web/src/lib/inngest/` (note: file is named `anaylyser.ts` — pre-existing typo).

## DB schema & migrations

- Schema is split across `packages/db/{auth-schema,mcp-schema,job-schema}.ts`, re-exported from `schema.ts`. ~44 tables (MCP apps/tags/categories/ads/payments/rankings/snapshots/repos, auth tables, job/experience tables).
- `drizzle.config.ts` loads env from repo root: **`.env.local` first, then `.env`**. Uses `POSTGRES_URL || DATABASE_URL` for migrations.
- The runtime DB client (`packages/db/index.ts`) uses **only `DATABASE_URL`**. If you set `POSTGRES_URL` for migrations, also keep `DATABASE_URL` set for the app.
- Migrations live in `packages/db/drizzle/` (numbered `.sql` + `meta/`). Generate with `db:generate`, apply with `db:migrate`.

## Environment variables

`.env` and `.env.local` are both gitignored. Copy from `.env.example`. Key groups:

- DB: `DATABASE_URL`, `POSTGRES_URL` (drizzle config prefers this).
- Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_BASE_URL` (or `AUTH_BASE_URL` / `BETTER_AUTH_BASE_URL` fallback for social login callback), `GOOGLE_CLIENT_ID/SECRET`.
- Email: `RESEND_API_KEY`, `RESEND_FROM` (preferred); SMTP fallback `MAIL_HOST/PORT/USER/PASSWORD/FROM`; `PUSHPLUS_TOKEN/CHANNEL/TEMPLATE/URL`, `ADMIN_EMAIL`.
- Storage: `R2_BUCKET_NAME`, `R2_ACCOUNT_ID`, `R2_PUBLIC_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` (Cloudflare R2 for logos/assets).
- SMS: `COS_SECERT_ID`, `COS_SECERT_KEY` (pre-existing typo in code — keep exact), `COS_SMS_APPID`, `COS_SMS_TEMPLATEID`, `COS_SMS_SIGN_NAME`.
- GitHub: `GITHUB_TOKEN`.
- Public: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/PUBLISHABLE_DEFAULT_KEY`.
- Server-only: `NEXT_INTERNAL_API_URL` (server→server tRPC base).

## Build / deploy quirks

- `apps/web/next.config.mjs`: `output: "standalone"` **unless `VERCEL` env is set** (then `undefined`, Vercel handles output). `assetPrefix` points to Aliyun OSS **only when `BUILD_ENV=production`** (set by `apps/web/build.sh`, not by Vercel).
- Docker: `.github/workflows/Dockerfile` builds via `pnpm build:web`, runs `node apps/web/server.js` on port 3000. CI (`.github/workflows/docker-image.yml`) triggers on push to `main`, pushes to `ghcr.io`, then curls a Dokploy redeploy webhook. Build args inject `NEXT_PUBLIC_*` from GH vars and secrets from GH secrets.
- Vercel: `apps/web/vercel.json` runs `cd ../.. && VERCEL=1 pnpm --filter web build` with `installCommand: cd ../.. && pnpm install --frozen-lockfile`.
- `apps/web/build.sh` is a manual standalone build: sets `BUILD_ENV=production`, bumps Node memory to 4GB, copies `bin/*` into standalone.

## .gitignore gotchas (read before assuming files are tracked)

- `scripts/*` is **entirely gitignored except 7 whitelisted files**: `scrape-byr-enhanced.ts`, `upload-byr-enhanced.ts`, `email-byr-digest.ts`, `scrape-byr-boards.ts`, `upload-byr-board-posts.ts`, `create-byr-board-posts-table.ts`, `sync-referrals.sh`. The other ~90 scripts in `scripts/` are **local-only** and will not appear in PRs or CI.
- `analysis/`, `imports/`, `webhook-data/`, root `*.xlsx`/`*.csv`/`byr_jobs*.json`/`byr_board_posts.json` are ignored.
- Root-level `*.html`, `*.txt`, `*.png` are ignored (scoped to root so web assets in subdirs are safe).
- All `.env*` are ignored.

## Style

- ESLint flat config per app/package, extending `@repo/eslint-config/{base,next-js,react-internal}`. Includes `eslint-plugin-simple-import-sort` and `only-warn`.
- `packages/db` uses **Biome** (`biome check . --write`) for lint — different from the rest. VSCode is configured to run Biome organizeImports/fixAll on save (affects `packages/db`).
- TypeScript/TSX formatting: 2-space, VSCode built-in formatter (not Prettier) for `.ts`/`.tsx`; Prettier for `.css`/`.json`. Root `pnpm format` runs Prettier on `**/*.{ts,tsx,md}`.
- shadcn/ui components: add with `pnpm dlx shadcn@latest add <component> -c apps/web`. They land in `packages/ui/src/components/` (per `apps/web/components.json`). Do not duplicate UI primitives in `apps/web/src/components`.

## Things to ignore

- `.github/copilot-instructions.md` is a GitHub Copilot Chat loop protocol (`copilot_enhance_3211` tool) — **not applicable to OpenCode**; do not treat it as repo conventions.
- The many root-level `*_DESIGN.md` / `*_REPORT.md` / `*_SUMMARY.md` files are historical design notes; verify against current code before relying on them.
- `run-mcp-supabase.sh` and `mcp-config.json` contain a hardcoded Supabase access token — do not propagate or reuse it.
