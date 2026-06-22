import assert from "node:assert/strict";
import test from "node:test";

import {
  markdownToCanonicalHtml,
  renderMiniProgramHtml,
  resolveExperienceSource,
  sanitizeCanonicalHtml,
} from "./experience-content";

test("resolves current markdown before legacy markdown and HTML", () => {
  assert.deepEqual(
    resolveExperienceSource({
      markdown_content: "# Current",
      metadata: { markdown_source: { content: "# Legacy" } },
      content_html: "<p>HTML</p>",
    }),
    {
      source: "markdown_content",
      value: "# Current",
      format: "markdown",
    }
  );
});

test("falls back from legacy markdown to HTML and empty content", () => {
  assert.equal(
    resolveExperienceSource({
      metadata: { markdown_source: { content: "Legacy" } },
      content_html: "<p>HTML</p>",
    }).source,
    "legacy_markdown"
  );
  assert.equal(
    resolveExperienceSource({ contentHtml: "<p>HTML</p>" }).source,
    "content_html"
  );
  assert.equal(resolveExperienceSource({}).source, "empty");
});

test("canonical sanitizer preserves semantic content and removes unsafe input", () => {
  const html = sanitizeCanonicalHtml(`
    <figure style="color:red" class="legacy"><img src="https://img.test/a.png" onerror="alert(1)"><figcaption>图注</figcaption></figure>
    <table><tr><td colspan="2">内容</td></tr></table>
    <details open><summary>更多</summary><mark>说明</mark></details>
    <a href="javascript:alert(1)" onclick="alert(1)">危险链接</a>
    <img src="data:image/png;base64,abc">
    <script>alert(1)</script><input checked>
  `);

  assert.match(html, /<figure>/);
  assert.match(html, /<figcaption>图注<\/figcaption>/);
  assert.match(html, /<table>/);
  assert.match(html, /<details open>/);
  assert.doesNotMatch(html, /style=|class=|onerror|onclick|javascript:|data:image|script|input/);
});

test("markdown conversion keeps structure and sanitizes raw HTML", async () => {
  const html = await markdownToCanonicalHtml(
    "## 标题\n\n**加粗**\n\n- 列表\n\n<script>alert(1)</script>"
  );
  assert.match(html, /<h2>标题<\/h2>/);
  assert.match(html, /<strong>加粗<\/strong>/);
  assert.match(html, /<li>列表<\/li>/);
  assert.doesNotMatch(html, /script|alert/);
});

test("mini renderer removes duplicate title and cover and extracts HTTPS links", () => {
  const rendered = renderMiniProgramHtml(
    `<p><img src="https://img.test/cover.png" alt="cover_image"></p>
     <h1>文章标题！</h1>
     <p>查看<a href="https://mp.weixin.qq.com/s?a=1&amp;b=2">原文</a>，重复<a href="https://mp.weixin.qq.com/s?a=1&amp;b=2">原文</a>。</p>
     <p><a href="javascript:void(0)">职场江湖指北</a></p>`,
    {
      title: "文章标题",
      coverAssetPath: "https://img.test/cover.png",
    }
  );

  assert.doesNotMatch(rendered.html, /cover_image|<h1|javascript:|href=/);
  assert.match(rendered.html, /\[1\]/);
  assert.equal(rendered.relatedLinks.length, 1);
  assert.deepEqual(rendered.relatedLinks[0], {
    label: "原文",
    url: "https://mp.weixin.qq.com/s?a=1&b=2",
  });
});

test("mini renderer injects controlled article styles", () => {
  const rendered = renderMiniProgramHtml(
    "<h2>标题</h2><blockquote>引用</blockquote><img src=\"https://img.test/a.png\"><pre><code>const a = 1</code></pre>"
  );
  assert.match(rendered.html, /font-size:36rpx/);
  assert.match(rendered.html, /border-left:8rpx solid #3b82f6/);
  assert.match(rendered.html, /max-width:100%/);
  assert.match(rendered.html, /white-space:pre-wrap/);
});
