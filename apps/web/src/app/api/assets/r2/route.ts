import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

// 验证请求参数的schema
const uploadRequestSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileSize: z.number().positive(),
  assetType: z.string().optional(),
});

// R2 配置
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucketName: process.env.R2_BUCKET_NAME!,
  publicUrl: process.env.R2_PUBLIC_URL!,
};

// 创建 S3 客户端 (R2 兼容 S3 API)
function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_CONFIG.accessKeyId,
      secretAccessKey: R2_CONFIG.secretAccessKey,
    },
  });
}

// 生成唯一的文件名
function generateFileName(originalName: string, assetType?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const prefix = assetType ? `${assetType}/` : "uploads/";
  return `${prefix}${timestamp}_${random}.${extension}`;
}

// POST方法：获取R2预签名上传URL
export async function POST(request: NextRequest) {
  try {
    // 验证 R2 配置
    if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
      console.error("R2配置缺失:", {
        hasAccountId: !!R2_CONFIG.accountId,
        hasAccessKeyId: !!R2_CONFIG.accessKeyId,
        hasSecretAccessKey: !!R2_CONFIG.secretAccessKey,
      });
      return NextResponse.json(
        { error: "R2存储配置不完整" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fileName, fileType, fileSize, assetType } = uploadRequestSchema.parse(body);

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: "文件大小超过限制（最大10MB）" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 生成R2文件名
    const r2FileName = generateFileName(fileName, assetType);

    // 创建R2客户端
    const client = getR2Client();

    // 创建 PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: r2FileName,
      ContentType: fileType,
    });

    // 生成预签名URL（有效期15分钟）
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });

    // 生成用于回调的assetId
    const assetId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // 生成公开访问URL
    const publicUrl = `${R2_CONFIG.publicUrl}/${r2FileName}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      assetId,
      r2FileName,
      publicUrl,
      expires: Date.now() + 900 * 1000, // 过期时间戳
    });
  } catch (error) {
    console.error("R2上传凭证生成失败:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求参数无效", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}

// GET方法：处理上传完成后的回调（可选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get("assetId");
    const url = searchParams.get("url");
    const size = searchParams.get("size");
    const mimeType = searchParams.get("mimeType");

    if (!assetId || !url) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    // 这里可以添加数据库记录逻辑
    console.log("R2文件上传完成:", {
      assetId,
      url,
      size: size ? parseInt(size) : 0,
      mimeType,
    });

    return NextResponse.json({
      success: true,
      message: "文件上传成功",
      assetId,
      url,
    });
  } catch (error) {
    console.error("上传回调处理失败:", error);

    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
