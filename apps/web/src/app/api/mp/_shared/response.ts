import { auth } from "@/lib/auth"
import { getUserFromBearer } from "@/lib/client-auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export function ok<T>(data: T) {
  return NextResponse.json({
    code: "OK",
    message: "success",
    data,
    requestId: crypto.randomUUID(),
  })
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      code,
      message,
      data: null,
      requestId: crypto.randomUUID(),
    },
    { status }
  )
}

export async function getCurrentUser(request?: Request) {
  if (request) {
    const bearerUser = await getUserFromBearer(request)
    if (bearerUser) return bearerUser
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  return session?.user ?? null
}

export function toMpUser(user: any) {
  if (!user) return null

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    role: user.role,
    gender: user.gender,
    address: user.address,
    contactPhone: user.contactPhone,
    profileCompletedAt: user.profileCompletedAt,
    createdAt: user.createdAt,
  }
}

export function getPaging(searchParams: URLSearchParams, defaults = { page: 1, pageSize: 20 }) {
  const page = Math.max(Number(searchParams.get("page") || defaults.page) || defaults.page, 1)
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("pageSize") || defaults.pageSize) || defaults.pageSize, 1),
    50
  )

  return {
    page,
    pageSize,
    from: (page - 1) * pageSize,
    to: page * pageSize - 1,
  }
}

export function splitParam(value: string | null) {
  if (!value) return []
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeDate(value?: string | Date | null) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}

export function stripHtml(value?: string | null, maxLength = 160) {
  if (!value) return ""
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
}
