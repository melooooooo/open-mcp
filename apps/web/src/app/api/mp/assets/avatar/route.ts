import { randomUUID } from "node:crypto"
import OSS from "ali-oss"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

import { saveAsset } from "@repo/db/database/admin"
import { fail, getCurrentUser, ok } from "../../_shared/response"

export const runtime = "nodejs"

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function inferContentType(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return ""
}

function fileExtension(contentType: string) {
  if (contentType === "image/png") return "png"
  if (contentType === "image/webp") return "webp"
  return "jpg"
}

function objectKey(userId: string, contentType: string) {
  return `avatars/${userId}/${Date.now()}_${randomUUID()}.${fileExtension(contentType)}`
}

function hasR2Config() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  )
}

async function uploadToR2(buffer: Buffer, userId: string, contentType: string) {
  const key = objectKey(userId, contentType)
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  return `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${key}`
}

function hasOssConfig() {
  return Boolean(
    process.env.ALIYUN_ACCESS_KEY_ID &&
      process.env.ALIYUN_ACCESS_KEY_SECRET &&
      process.env.ALIYUN_OSS_BUCKET
  )
}

async function uploadToOss(buffer: Buffer, userId: string, contentType: string) {
  const region = process.env.ALIYUN_OSS_REGION || "oss-cn-hangzhou"
  const bucket = process.env.ALIYUN_OSS_BUCKET!
  const key = objectKey(userId, contentType)
  const client = new OSS({
    region,
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
    bucket,
  })

  await client.put(key, buffer, {
    headers: {
      "Content-Type": contentType,
    },
  })

  const publicBase =
    process.env.ALIYUN_OSS_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_ALIYUN_OSS_PUBLIC_URL ||
    `https://${bucket}.${region}.aliyuncs.com`
  return `${publicBase.replace(/\/$/, "")}/${key}`
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request)
  if (!currentUser?.id) return fail("UNAUTHORIZED", "请先登录", 401)

  const formData = await request.formData().catch(() => null)
  const data = formData?.get("file") ?? formData?.get("image")

  if (!(data instanceof File)) return fail("BAD_REQUEST", "缺少头像文件")

  const contentType = data.type || inferContentType(data.name)
  if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
    return fail("UNSUPPORTED_MEDIA_TYPE", "仅支持 JPG、PNG 或 WebP 头像", 400)
  }
  if (data.size > MAX_AVATAR_SIZE_BYTES) {
    return fail("PAYLOAD_TOO_LARGE", "头像不能超过 2MB", 413)
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const assetId = randomUUID()

  try {
    const url = hasR2Config()
      ? await uploadToR2(buffer, currentUser.id, contentType)
      : hasOssConfig()
        ? await uploadToOss(buffer, currentUser.id, contentType)
        : null

    if (url) return ok({ url, assetId })

    const asset = await saveAsset({
      userId: currentUser.id,
      assetType: "avatar",
      contentType,
      fileName: data.name || `avatar.${fileExtension(contentType)}`,
      size: data.size,
      buffer,
    })
    const origin = process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin
    return ok({
      url: `${origin.replace(/\/$/, "")}/api/assets/${asset?.id}`,
      assetId: asset?.id || assetId,
    })
  } catch (error) {
    console.error("[mp/assets/avatar] upload failed", error)
    return fail("INTERNAL_ERROR", "头像上传失败，请稍后重试", 500)
  }
}
