#!/usr/bin/env tsx
/**
 * 数据迁移脚本：将经验分享内容迁移到 markdown_content 字段
 * 
 * 迁移策略：
 * 1. 如果 metadata.markdown_source.content 存在，复制到 markdown_content
 * 2. 如果不存在，将 content_html 转换为 markdown 并存入 markdown_content
 * 3. 更新 updated_at 字段
 */

import { db } from "@repo/db";
import { financeExperiences } from "@repo/db/schema";
import { isNotNull, sql } from "drizzle-orm";
import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
});

async function migrateExperienceMarkdown() {
  console.log("🚀 开始迁移经验分享内容到 markdown_content 字段...\n");

  try {
    // 获取所有经验分享记录
    const experiences = await db
      .select({
        id: financeExperiences.id,
        slug: financeExperiences.slug,
        title: financeExperiences.title,
        metadata: financeExperiences.metadata,
        contentHtml: financeExperiences.contentHtml,
        markdownContent: financeExperiences.markdownContent,
      })
      .from(financeExperiences);

    console.log(`📊 找到 ${experiences.length} 条经验分享记录\n`);

    let migratedFromMetadata = 0;
    let convertedFromHtml = 0;
    let alreadyHasMarkdown = 0;
    let skipped = 0;

    for (const exp of experiences) {
      const { id, slug, title, metadata, contentHtml, markdownContent } = exp;

      // 如果已经有 markdown_content，跳过
      if (markdownContent) {
        console.log(`✓ [${slug}] 已有 markdown_content，跳过`);
        alreadyHasMarkdown++;
        continue;
      }

      let newMarkdownContent: string | null = null;

      // 策略 1: 从 metadata.markdown_source.content 复制
      if (metadata && typeof metadata === "object") {
        const metadataObj = metadata as any;
        if (metadataObj.markdown_source?.content) {
          newMarkdownContent = metadataObj.markdown_source.content;
          console.log(`📝 [${slug}] 从 metadata.markdown_source 复制`);
          migratedFromMetadata++;
        }
      }

      // 策略 2: 从 content_html 转换
      if (!newMarkdownContent && contentHtml) {
        try {
          newMarkdownContent = turndownService.turndown(contentHtml);
          console.log(`🔄 [${slug}] 从 HTML 转换为 Markdown`);
          convertedFromHtml++;
        } catch (error) {
          console.error(`❌ [${slug}] HTML 转换失败:`, error);
          skipped++;
          continue;
        }
      }

      // 如果两种策略都没有获取到内容，跳过
      if (!newMarkdownContent) {
        console.log(`⚠️  [${slug}] 无可用内容，跳过`);
        skipped++;
        continue;
      }

      // 更新数据库
      try {
        await db
          .update(financeExperiences)
          .set({
            markdownContent: newMarkdownContent,
            updatedAt: new Date(),
          })
          .where(sql`${financeExperiences.id} = ${id}`);

        console.log(`✅ [${slug}] 迁移成功\n`);
      } catch (error) {
        console.error(`❌ [${slug}] 数据库更新失败:`, error);
        skipped++;
      }
    }

    // 输出统计信息
    console.log("\n" + "=".repeat(60));
    console.log("📊 迁移统计:");
    console.log("=".repeat(60));
    console.log(`总记录数:           ${experiences.length}`);
    console.log(`从 metadata 复制:   ${migratedFromMetadata}`);
    console.log(`从 HTML 转换:       ${convertedFromHtml}`);
    console.log(`已有 markdown:      ${alreadyHasMarkdown}`);
    console.log(`跳过:               ${skipped}`);
    console.log("=".repeat(60));
    console.log("\n✨ 迁移完成！\n");

  } catch (error) {
    console.error("❌ 迁移过程中发生错误:", error);
    process.exit(1);
  }
}

// 执行迁移
migrateExperienceMarkdown()
  .then(() => {
    console.log("👋 脚本执行完毕");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 脚本执行失败:", error);
    process.exit(1);
  });
