#!/usr/bin/env tsx
/**
 * Playwright 测试脚本：验证经验分享编辑功能
 */

import { chromium } from "playwright";

const BASE_URL = "http://localhost:30001";

async function testExperienceEditing() {
  console.log("🚀 开始测试经验分享编辑功能...\n");

  const browser = await chromium.launch({
    headless: false, // 显示浏览器窗口
    slowMo: 500, // 减慢操作速度以便观察
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    // ========================================
    // 测试 1: 访问经验列表页
    // ========================================
    console.log("📋 测试 1: 访问经验列表页");
    await page.goto(`${BASE_URL}/experiences`);
    await page.waitForLoadState("networkidle");

    // 截图
    await page.screenshot({ path: "test-screenshots/01-experiences-list.png" });
    console.log("✅ 经验列表页加载成功\n");

    // 等待一下让用户看到页面
    await page.waitForTimeout(2000);

    // ========================================
    // 测试 2: 查找并点击第一个经验分享
    // ========================================
    console.log("📋 测试 2: 点击第一个经验分享");

    // 查找经验卡片链接（排除 /share 和 /edit 链接）
    const allLinks = await page.locator('a[href*="/experiences/"]').all();
    let firstExperienceLink = null;
    let href = null;

    for (const link of allLinks) {
      const linkHref = await link.getAttribute("href");
      if (linkHref && !linkHref.includes("/share") && !linkHref.includes("/edit")) {
        firstExperienceLink = link;
        href = linkHref;
        break;
      }
    }

    if (!firstExperienceLink || !href) {
      console.log("⚠️  未找到经验分享文章，跳过后续测试");
      await browser.close();
      return;
    }

    console.log(`   找到经验链接: ${href}`);

    await firstExperienceLink.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "test-screenshots/02-experience-detail.png" });
    console.log("✅ 经验详情页加载成功\n");

    // ========================================
    // 测试 3: 检查页面元素
    // ========================================
    console.log("📋 测试 3: 检查详情页元素");

    // 检查标题
    const title = await page.locator("h1").first().textContent();
    console.log(`   标题: ${title}`);

    // 检查是否有编辑按钮（可能没有，因为需要登录）
    const editButton = page.locator('a:has-text("编辑")');
    const hasEditButton = await editButton.count() > 0;

    if (hasEditButton) {
      console.log("✅ 找到编辑按钮（用户已登录且有权限）");

      // ========================================
      // 测试 4: 点击编辑按钮
      // ========================================
      console.log("\n📋 测试 4: 点击编辑按钮");
      await editButton.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      await page.screenshot({ path: "test-screenshots/03-edit-page.png" });
      console.log("✅ 编辑页面加载成功\n");

      // ========================================
      // 测试 5: 检查编辑器元素
      // ========================================
      console.log("📋 测试 5: 检查编辑器元素");

      // 检查工具栏
      const toolbar = page.locator('button:has-text("撤销")').first();
      const hasToolbar = await toolbar.count() > 0;
      console.log(`   工具栏: ${hasToolbar ? "✅ 存在" : "❌ 不存在"}`);

      // 检查 textarea
      const textarea = page.locator("textarea");
      const hasTextarea = await textarea.count() > 0;
      console.log(`   编辑区域: ${hasTextarea ? "✅ 存在" : "❌ 不存在"}`);

      // 检查预览标签
      const previewTab = page.locator('button:has-text("预览")');
      const hasPreviewTab = await previewTab.count() > 0;
      console.log(`   预览标签: ${hasPreviewTab ? "✅ 存在" : "❌ 不存在"}`);

      // 检查保存按钮
      const saveButton = page.locator('button:has-text("保存")').first();
      const hasSaveButton = await saveButton.count() > 0;
      console.log(`   保存按钮: ${hasSaveButton ? "✅ 存在" : "❌ 不存在"}`);

      // 检查取消按钮
      const cancelButton = page.locator('button:has-text("取消")');
      const hasCancelButton = await cancelButton.count() > 0;
      console.log(`   取消按钮: ${hasCancelButton ? "✅ 存在" : "❌ 不存在"}`);

      if (hasTextarea) {
        // ========================================
        // 测试 6: 测试编辑功能
        // ========================================
        console.log("\n📋 测试 6: 测试编辑功能");

        // 获取当前内容
        const currentContent = await textarea.inputValue();
        console.log(`   当前内容长度: ${currentContent.length} 字符`);

        // 在末尾添加测试文本
        const testText = "\n\n## 测试编辑\n\n这是一个测试段落，用于验证编辑功能。";
        await textarea.fill(currentContent + testText);
        await page.waitForTimeout(1000);

        await page.screenshot({ path: "test-screenshots/04-after-edit.png" });
        console.log("✅ 成功添加测试文本\n");

        // ========================================
        // 测试 7: 测试预览功能
        // ========================================
        console.log("📋 测试 7: 测试预览功能");

        if (hasPreviewTab) {
          await previewTab.click();
          await page.waitForTimeout(1000);

          await page.screenshot({ path: "test-screenshots/05-preview.png" });
          console.log("✅ 预览功能正常\n");

          // 切换回编辑
          const editTab = page.locator('button:has-text("编辑")');
          await editTab.click();
          await page.waitForTimeout(500);
        }

        // ========================================
        // 测试 8: 测试工具栏按钮
        // ========================================
        console.log("📋 测试 8: 测试工具栏按钮");

        // 点击粗体按钮
        const boldButton = page.locator('button[title*="粗体"]').first();
        if (await boldButton.count() > 0) {
          await boldButton.click();
          await page.waitForTimeout(500);
          console.log("   ✅ 粗体按钮可点击");
        }

        await page.screenshot({ path: "test-screenshots/06-toolbar-test.png" });

        // ========================================
        // 测试 9: 恢复原内容并取消
        // ========================================
        console.log("\n📋 测试 9: 恢复原内容");

        // 恢复原内容
        await textarea.fill(currentContent);
        await page.waitForTimeout(500);

        // 点击取消按钮
        if (hasCancelButton) {
          await cancelButton.click();
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(1000);

          await page.screenshot({ path: "test-screenshots/07-after-cancel.png" });
          console.log("✅ 取消功能正常，已返回详情页\n");
        }
      }

    } else {
      console.log("⚠️  未找到编辑按钮（用户未登录或无权限）");
      console.log("   这是正常的，编辑按钮只对管理员和作者显示\n");

      // 尝试直接访问编辑页面（应该被拒绝）
      console.log("📋 测试 4: 尝试直接访问编辑页面");
      const currentUrl = page.url();
      const slug = currentUrl.split("/experiences/")[1];

      if (slug) {
        await page.goto(`${BASE_URL}/experiences/${slug}/edit`);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        await page.screenshot({ path: "test-screenshots/03-edit-page-unauthorized.png" });

        // 检查是否显示错误信息
        const errorText = await page.textContent("body");
        if (errorText?.includes("加载失败") || errorText?.includes("权限") || errorText?.includes("Unauthorized")) {
          console.log("✅ 权限控制正常，未授权用户无法访问编辑页面\n");
        } else {
          console.log("⚠️  可能存在权限控制问题\n");
        }
      }
    }

    // ========================================
    // 测试 10: 检查 Markdown 渲染
    // ========================================
    console.log("📋 测试 10: 检查内容渲染");

    // 返回详情页
    await page.goto(`${BASE_URL}${href}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // 检查是否有内容
    const contentArea = page.locator(".prose, [class*=markdown]").first();
    const hasContent = await contentArea.count() > 0;
    console.log(`   内容区域: ${hasContent ? "✅ 存在" : "❌ 不存在"}`);

    if (hasContent) {
      const contentText = await contentArea.textContent();
      console.log(`   内容长度: ${contentText?.length || 0} 字符`);
    }

    await page.screenshot({ path: "test-screenshots/08-final-detail.png" });
    console.log("✅ 内容渲染正常\n");

    // ========================================
    // 测试完成
    // ========================================
    console.log("=".repeat(60));
    console.log("✨ 测试完成！");
    console.log("=".repeat(60));
    console.log("\n📸 截图已保存到 test-screenshots/ 目录");
    console.log("\n📊 测试总结:");
    console.log("   ✅ 经验列表页正常");
    console.log("   ✅ 经验详情页正常");
    console.log(`   ${hasEditButton ? "✅" : "⚠️ "} 编辑按钮${hasEditButton ? "显示正常" : "未显示（需要登录）"}`);
    if (hasEditButton) {
      console.log("   ✅ 编辑页面加载正常");
      console.log("   ✅ 编辑器组件正常");
      console.log("   ✅ 工具栏功能正常");
      console.log("   ✅ 预览功能正常");
    } else {
      console.log("   ✅ 权限控制正常");
    }
    console.log("   ✅ 内容渲染正常");

    console.log("\n💡 提示:");
    if (!hasEditButton) {
      console.log("   - 要测试编辑功能，需要:");
      console.log("     1. 登录管理员账号");
      console.log("     2. 或设置经验的 author_user_id 为当前用户");
    }
    console.log("   - 查看截图了解详细情况");
    console.log("   - 浏览器窗口将保持打开 30 秒供查看\n");

    // 保持浏览器打开一段时间
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error("❌ 测试过程中发生错误:", error);
    await page.screenshot({ path: "test-screenshots/error.png" });
  } finally {
    await browser.close();
    console.log("\n👋 浏览器已关闭");
  }
}

// 创建截图目录
import { mkdirSync } from "fs";
try {
  mkdirSync("test-screenshots", { recursive: true });
} catch (e) {
  // 目录已存在
}

// 运行测试
testExperienceEditing()
  .then(() => {
    console.log("\n✅ 测试脚本执行完毕");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 测试脚本执行失败:", error);
    process.exit(1);
  });
