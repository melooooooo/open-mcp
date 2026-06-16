import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto"
import { createId } from "@paralleldrive/cuid2"
import { and, eq, gt, isNull } from "drizzle-orm"

import { db } from "@repo/db"
import { clientSession, user as userTable } from "@repo/db/schema"

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60
const REFRESH_TOKEN_TTL_DAYS = 60
const ACCESS_TOKEN_PREFIX = "mpa"
const REFRESH_TOKEN_PREFIX = "mpr"

type ClientType = "mini_program" | "ios" | "android" | "cli"

type AccessTokenPayload = {
  typ: "access"
  sub: string
  sid: string
  iat: number
  exp: number
}

export type CurrentUser = typeof userTable.$inferSelect

function getTokenSecret() {
  const secret = process.env.AUTH_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error("AUTH_TOKEN_SECRET or BETTER_AUTH_SECRET is required for client auth tokens")
  }
  return secret
}

function encodePayload(payload: AccessTokenPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
}

function decodePayload(value: string): AccessTokenPayload | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AccessTokenPayload
  } catch {
    return null
  }
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getTokenSecret()).update(encodedPayload).digest("base64url")
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function createAccessToken(userId: string, sessionId: string) {
  const now = Math.floor(Date.now() / 1000)
  const payload = encodePayload({
    typ: "access",
    sub: userId,
    sid: sessionId,
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
  })
  return `${ACCESS_TOKEN_PREFIX}.${payload}.${signPayload(payload)}`
}

function createRefreshToken() {
  return `${REFRESH_TOKEN_PREFIX}_${randomBytes(32).toString("base64url")}`
}

export async function createClientAuthSession(options: {
  userId: string
  clientType: ClientType
  deviceId?: string
}) {
  const now = new Date()
  const sessionId = createId()
  const refreshToken = createRefreshToken()

  await db.insert(clientSession).values({
    id: sessionId,
    userId: options.userId,
    clientType: options.clientType,
    deviceId: options.deviceId,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: addDays(now, REFRESH_TOKEN_TTL_DAYS),
    lastUsedAt: now,
    createdAt: now,
    updatedAt: now,
  })

  return {
    accessToken: createAccessToken(options.userId, sessionId),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken,
  }
}

export async function refreshClientAuthSession(refreshToken: string) {
  const now = new Date()
  const existing = await db.query.clientSession.findFirst({
    where: and(
      eq(clientSession.refreshTokenHash, hashToken(refreshToken)),
      isNull(clientSession.revokedAt),
      gt(clientSession.expiresAt, now)
    ),
  })

  if (!existing) return null

  const currentUser = await db.query.user.findFirst({
    where: eq(userTable.id, existing.userId),
  })
  if (!currentUser || currentUser.banned) return null

  const nextRefreshToken = createRefreshToken()
  await db
    .update(clientSession)
    .set({
      refreshTokenHash: hashToken(nextRefreshToken),
      lastUsedAt: now,
      updatedAt: now,
      expiresAt: addDays(now, REFRESH_TOKEN_TTL_DAYS),
    })
    .where(eq(clientSession.id, existing.id))

  return {
    accessToken: createAccessToken(existing.userId, existing.id),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken: nextRefreshToken,
    user: currentUser,
  }
}

export async function markMiniProgramActivated(userId: string) {
  const now = new Date()
  await db
    .update(userTable)
    .set({ miniProgramActivatedAt: now, updatedAt: now })
    .where(and(eq(userTable.id, userId), isNull(userTable.miniProgramActivatedAt)))
}

export async function revokeClientAuthSession(refreshToken: string) {
  const now = new Date()
  await db
    .update(clientSession)
    .set({ revokedAt: now, updatedAt: now })
    .where(eq(clientSession.refreshTokenHash, hashToken(refreshToken)))
}

export async function getUserFromBearer(request: Request) {
  const authorization = request.headers.get("authorization") || ""
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  const token = match?.[1]
  if (!token) return null

  const [prefix, encodedPayload, signature] = token.split(".")
  if (prefix !== ACCESS_TOKEN_PREFIX || !encodedPayload || !signature) return null
  if (!safeEqual(signature, signPayload(encodedPayload))) return null

  const payload = decodePayload(encodedPayload)
  if (!payload || payload.typ !== "access") return null
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null

  const activeSession = await db.query.clientSession.findFirst({
    where: and(
      eq(clientSession.id, payload.sid),
      eq(clientSession.userId, payload.sub),
      isNull(clientSession.revokedAt),
      gt(clientSession.expiresAt, new Date())
    ),
  })
  if (!activeSession) return null

  const currentUser = await db.query.user.findFirst({
    where: eq(userTable.id, payload.sub),
  })

  if (!currentUser || currentUser.banned) return null
  return currentUser
}
