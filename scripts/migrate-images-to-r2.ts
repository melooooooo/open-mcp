import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') })


// R2 配置
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID!,
  accessKeyId: process.env.R2_ACCESS_KEY_ID!,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  bucketName: process.env.R2_BUCKET_NAME!,
  publicUrl: process.env.R2_PUBLIC_URL!,
}

// 创建 S3 客户端 (R2 兼容 S3 API)
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
})

interface ImageMapping {
  original: string
  r2Url: string
}

const imageMappings: ImageMapping[] = []

/**
 * 从 URL 下载图片
 */
async function downloadImage(url: string): Promise<Buffer> {
  console.log(`  下载图片: ${url}`)
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  })

  if (!response.ok) {
    throw new Error(`下载失败: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * 上传图片到 R2
 */
async function uploadToR2(
  buffer: Buffer,
  originalUrl: string
): Promise<string> {
  // 生成文件名 (使用 URL 的 hash)
  const hash = crypto.createHash('md5').update(originalUrl).digest('hex')
  const ext = originalUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg'
  const fileName = `experiences/images/${hash}.${ext}`

  // 检测 MIME 类型
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  const contentType = mimeTypes[ext.toLowerCase()] || 'image/jpeg'

  console.log(`  上传到 R2: ${fileName}`)

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    })
  )

  const r2Url = `${R2_CONFIG.publicUrl}/${fileName}`
  console.log(`  ✓ 上传成功: ${r2Url}`)

  return r2Url
}

/**
 * 提取文本中的所有微信图片 URL
 */
function extractWeChatImageUrls(text: string): string[] {
  const regex = /https?:\/\/mmbiz\.qpic\.cn\/[^\s\)"']+/g
  const matches = text.match(regex) || []
  return [...new Set(matches)] // 去重
}

/**
 * 迁移单个图片
 */
async function migrateImage(url: string): Promise<ImageMapping> {
  // 检查是否已经迁移过
  const existing = imageMappings.find((m) => m.original === url)
  if (existing) {
    console.log(`  跳过已迁移的图片: ${url}`)
    return existing
  }

  try {
    const buffer = await downloadImage(url)
    const r2Url = await uploadToR2(buffer, url)

    const mapping: ImageMapping = { original: url, r2Url }
    imageMappings.push(mapping)

    return mapping
  } catch (error) {
    console.error(`  ✗ 迁移失败: ${url}`, error)
    throw error
  }
}

/**
 * 替换文本中的图片 URL
 */
function replaceImageUrls(text: string, mappings: ImageMapping[]): string {
  let result = text
  for (const mapping of mappings) {
    result = result.replaceAll(mapping.original, mapping.r2Url)
  }
  return result
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始迁移微信图片到 R2...\n')

  // 读取数据文件
  const dataPath = path.join(
    process.cwd(),
    'analysis/finance-experiences.json'
  )
  console.log(`📖 读取数据文件: ${dataPath}`)
  const rawData = await fs.readFile(dataPath, 'utf-8')
  const data = JSON.parse(rawData)

  console.log(`📊 共有 ${data.length} 条经验数据\n`)

  // 提取所有图片 URL
  console.log('🔍 扫描所有微信图片 URL...')
  const allImageUrls = new Set<string>()

  for (const item of data) {
    // 从各个字段中提取图片
    const fields = [
      item.content_html,
      item.content,
      item.metadata?.markdown_source?.content,
    ]

    for (const field of fields) {
      if (typeof field === 'string') {
        const urls = extractWeChatImageUrls(field)
        urls.forEach((url) => allImageUrls.add(url))
      }
    }

    // 从 sections 中提取
    if (Array.isArray(item.sections)) {
      for (const section of item.sections) {
        if (section.body_html) {
          const urls = extractWeChatImageUrls(section.body_html)
          urls.forEach((url) => allImageUrls.add(url))
        }
      }
    }
  }

  const imageUrlsArray = Array.from(allImageUrls)
  console.log(`✓ 找到 ${imageUrlsArray.length} 个唯一的微信图片\n`)

  if (imageUrlsArray.length === 0) {
    console.log('✓ 没有需要迁移的图片')
    return
  }

  // 迁移图片
  console.log('📦 开始下载并上传图片...\n')
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < imageUrlsArray.length; i++) {
    const url = imageUrlsArray[i]
    console.log(`[${i + 1}/${imageUrlsArray.length}] 处理图片:`)

    try {
      await migrateImage(url)
      successCount++
    } catch (error) {
      failCount++
      console.error(`  ✗ 失败: ${error}`)
    }

    // 添加延迟避免请求过快
    if (i < imageUrlsArray.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  console.log(
    `\n📊 迁移统计: 成功 ${successCount} 个, 失败 ${failCount} 个\n`
  )

  if (successCount === 0) {
    console.log('✗ 没有成功迁移的图片,跳过更新数据文件')
    return
  }

  // 更新数据文件
  console.log('📝 更新数据文件中的图片 URL...')

  for (const item of data) {
    // 更新各个字段
    if (item.content_html) {
      item.content_html = replaceImageUrls(item.content_html, imageMappings)
    }
    if (item.content) {
      item.content = replaceImageUrls(item.content, imageMappings)
    }
    if (item.metadata?.markdown_source?.content) {
      item.metadata.markdown_source.content = replaceImageUrls(
        item.metadata.markdown_source.content,
        imageMappings
      )
    }

    // 更新 sections
    if (Array.isArray(item.sections)) {
      for (const section of item.sections) {
        if (section.body_html) {
          section.body_html = replaceImageUrls(section.body_html, imageMappings)
        }
      }
    }
  }

  // 备份原文件
  const backupPath = dataPath + '.backup.' + Date.now()
  console.log(`💾 备份原文件到: ${backupPath}`)
  await fs.writeFile(backupPath, rawData, 'utf-8')

  // 保存更新后的数据
  console.log(`💾 保存更新后的数据到: ${dataPath}`)
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8')

  // 保存映射记录
  const mappingPath = path.join(process.cwd(), 'analysis/image-mappings.json')
  console.log(`💾 保存图片映射记录到: ${mappingPath}`)
  await fs.writeFile(
    mappingPath,
    JSON.stringify(imageMappings, null, 2),
    'utf-8'
  )

  console.log('\n✅ 图片迁移完成!')
  console.log(`   - 成功迁移: ${successCount} 个图片`)
  console.log(`   - 已更新数据文件`)
  console.log(`   - 原文件已备份`)
}

// 运行
main().catch((error) => {
  console.error('❌ 迁移过程出错:', error)
  process.exit(1)
})
