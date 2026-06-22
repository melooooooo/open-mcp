import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

type SanitizeOptions = NonNullable<Parameters<typeof sanitizeHtml>[1]>;

export type ExperienceContentSource =
  | "markdown_content"
  | "legacy_markdown"
  | "content_html"
  | "empty";

export type ResolvedExperienceSource = {
  source: ExperienceContentSource;
  value: string;
  format: "markdown" | "html";
};

export type ExperienceContentRow = {
  markdown_content?: unknown;
  markdownContent?: unknown;
  content_html?: unknown;
  contentHtml?: unknown;
  metadata?: unknown;
};

export type RelatedExperienceLink = {
  label: string;
  url: string;
};

type MiniProgramRenderOptions = {
  title?: string | null;
  coverAssetPath?: string | null;
};

const canonicalAllowedAttributes: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height"],
  ol: ["start"],
  li: ["value"],
  th: ["align", "colspan", "rowspan"],
  td: ["align", "colspan", "rowspan"],
  details: ["open"],
};

const canonicalTags = [
  "p",
  "span",
  "strong",
  "em",
  "del",
  "ins",
  "mark",
  "ul",
  "ol",
  "li",
  "br",
  "blockquote",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "img",
  "a",
  "hr",
  "figure",
  "figcaption",
  "div",
  "details",
  "summary",
];

const canonicalSanitizeOptions: SanitizeOptions = {
  allowedTags: canonicalTags,
  allowedAttributes: canonicalAllowedAttributes,
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: {
    img: ["https"],
  },
  allowProtocolRelative: false,
};

const miniProgramTags = canonicalTags.filter(
  (tag) => !["details", "summary"].includes(tag)
);

const miniProgramSanitizeOptions: SanitizeOptions = {
  ...canonicalSanitizeOptions,
  allowedTags: miniProgramTags,
  allowedAttributes: {
    ...canonicalAllowedAttributes,
    "*": ["style"],
  },
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{6}$/i],
      display: [/^(block|inline|inline-block)$/],
      "font-family": [/^monospace$/],
      "font-size": [/^\d+rpx$/],
      "font-style": [/^italic$/],
      "font-weight": [/^(600|700|bold)$/],
      "line-height": [/^\d+(\.\d+)?$/],
      "list-style-position": [/^outside$/],
      "max-width": [/^100%$/],
      "overflow-wrap": [/^anywhere$/],
      "text-decoration": [/^line-through$/],
      "vertical-align": [/^super$/],
      "white-space": [/^pre-wrap$/],
      width: [/^100%$/],
      height: [/^auto$/],
      margin: [/^[\d\srpx]+$/],
      "margin-top": [/^\d+rpx$/],
      "margin-bottom": [/^\d+rpx$/],
      padding: [/^[\d\srpx]+$/],
      "padding-left": [/^\d+rpx$/],
      "border-left": [/^\d+rpx solid #[0-9a-f]{6}$/i],
      "border-radius": [/^\d+rpx$/],
      "background-color": [/^#[0-9a-f]{6}$/i],
    },
  },
  transformTags: {
    details: "div",
    summary: "strong",
    p: addStyle("margin: 0 0 24rpx; color: #374151; font-size: 30rpx; line-height: 1.8; overflow-wrap: anywhere"),
    h1: addStyle("margin: 42rpx 0 24rpx; color: #111827; font-size: 38rpx; font-weight: 700; line-height: 1.45"),
    h2: addStyle("margin: 40rpx 0 22rpx; color: #111827; font-size: 36rpx; font-weight: 700; line-height: 1.5"),
    h3: addStyle("margin: 32rpx 0 18rpx; color: #111827; font-size: 32rpx; font-weight: 700; line-height: 1.55"),
    h4: addStyle("margin: 28rpx 0 16rpx; color: #111827; font-size: 30rpx; font-weight: 700; line-height: 1.55"),
    h5: addStyle("margin: 26rpx 0 14rpx; color: #111827; font-size: 30rpx; font-weight: 600; line-height: 1.55"),
    h6: addStyle("margin: 24rpx 0 12rpx; color: #374151; font-size: 28rpx; font-weight: 600; line-height: 1.55"),
    blockquote: addStyle("margin: 28rpx 0; padding: 22rpx 24rpx; border-left: 8rpx solid #3b82f6; border-radius: 10rpx; background-color: #eff6ff; color: #4b5563; line-height: 1.75"),
    ul: addStyle("margin: 20rpx 0 24rpx; padding-left: 42rpx; list-style-position: outside"),
    ol: addStyle("margin: 20rpx 0 24rpx; padding-left: 42rpx; list-style-position: outside"),
    li: addStyle("margin-bottom: 12rpx; color: #374151; font-size: 30rpx; line-height: 1.75"),
    pre: addStyle("margin: 28rpx 0; padding: 24rpx; border-radius: 12rpx; background-color: #f3f4f6; color: #1f2937; font-family: monospace; font-size: 26rpx; line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere"),
    code: addStyle("padding: 4rpx 8rpx; border-radius: 6rpx; background-color: #f3f4f6; color: #be123c; font-family: monospace; font-size: 26rpx; overflow-wrap: anywhere"),
    img: addStyle("display: block; width: 100%; max-width: 100%; height: auto; margin: 28rpx 0; border-radius: 16rpx"),
    figure: addStyle("display: block; margin: 28rpx 0"),
    figcaption: addStyle("margin-top: 12rpx; color: #6b7280; font-size: 24rpx; line-height: 1.6"),
    table: addStyle("display: block; width: 100%; margin: 28rpx 0; font-size: 26rpx; overflow-wrap: anywhere"),
    hr: addStyle("display: block; margin: 36rpx 0; color: #e5e7eb"),
  },
};

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function addStyle(style: string) {
  return (tagName: string, attribs: Record<string, string>) => ({
    tagName,
    attribs: { ...attribs, style },
  });
}

function legacyMarkdown(metadata: unknown): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const markdownSource = (metadata as Record<string, unknown>).markdown_source;
  if (
    !markdownSource ||
    typeof markdownSource !== "object" ||
    Array.isArray(markdownSource)
  ) {
    return "";
  }

  return stringValue((markdownSource as Record<string, unknown>).content);
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function plainText(html: string): string {
  return decodeHtmlEntities(
    sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
  )
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    );
}

function normalizeComparableText(value: string): string {
  return value.replace(/\s+/g, "").replace(/[!！:：\-–—]/g, "").toLowerCase();
}

function removeLeadingDuplicateTitle(html: string, title?: string | null): string {
  if (!title) return html;
  const match = html.match(/^\s*<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>\s*/i);
  if (!match) return html;

  return normalizeComparableText(plainText(match[1] || "")) ===
    normalizeComparableText(title)
    ? html.slice(match[0].length)
    : html;
}

function removeLeadingDuplicateCover(
  html: string,
  coverAssetPath?: string | null
): string {
  const leading = html.match(
    /^\s*(?:<p(?:\s[^>]*)?>\s*)?(<img\s[^>]*>)(?:\s*<\/p>)?\s*/i
  );
  if (!leading) return html;

  const imageTag = leading[1] || "";
  const src = imageTag.match(/\bsrc=(?:"([^"]*)"|'([^']*)')/i);
  const alt = imageTag.match(/\balt=(?:"([^"]*)"|'([^']*)')/i);
  const imageSrc = decodeHtmlEntities(src?.[1] || src?.[2] || "");
  const imageAlt = decodeHtmlEntities(alt?.[1] || alt?.[2] || "");
  const isDuplicate =
    imageAlt === "cover_image" ||
    Boolean(coverAssetPath && imageSrc === coverAssetPath);

  return isDuplicate ? html.slice(leading[0].length) : html;
}

function normalizeLeadingContent(
  html: string,
  options: MiniProgramRenderOptions
): string {
  let normalized = html;
  normalized = removeLeadingDuplicateCover(normalized, options.coverAssetPath);
  normalized = removeLeadingDuplicateTitle(normalized, options.title);
  normalized = removeLeadingDuplicateCover(normalized, options.coverAssetPath);
  return normalized.trim();
}

function extractRelatedLinks(html: string): {
  html: string;
  relatedLinks: RelatedExperienceLink[];
} {
  const relatedLinks: RelatedExperienceLink[] = [];
  const seen = new Set<string>();

  const renderedHtml = html.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (fullMatch, rawAttributes: string, innerHtml: string) => {
      const hrefMatch = rawAttributes.match(
        /\bhref=(?:"([^"]*)"|'([^']*)')/i
      );
      const url = decodeHtmlEntities(hrefMatch?.[1] || hrefMatch?.[2] || "");
      const label = plainText(innerHtml) || url;

      if (!url.startsWith("https://")) {
        return innerHtml;
      }

      let index = relatedLinks.findIndex((item) => item.url === url);
      if (!seen.has(url)) {
        seen.add(url);
        relatedLinks.push({ label, url });
        index = relatedLinks.length - 1;
      }

      return `<span>${innerHtml}<span style="color: #2563eb; font-size: 22rpx; vertical-align: super">[${index + 1}]</span></span>`;
    }
  );

  return { html: renderedHtml, relatedLinks };
}

export function resolveExperienceSource(
  row: ExperienceContentRow
): ResolvedExperienceSource {
  const markdown = stringValue(row.markdown_content ?? row.markdownContent);
  if (isNonEmpty(markdown)) {
    return { source: "markdown_content", value: markdown, format: "markdown" };
  }

  const legacy = legacyMarkdown(row.metadata);
  if (isNonEmpty(legacy)) {
    return { source: "legacy_markdown", value: legacy, format: "markdown" };
  }

  const html = stringValue(row.content_html ?? row.contentHtml);
  if (isNonEmpty(html)) {
    return { source: "content_html", value: html, format: "html" };
  }

  return { source: "empty", value: "", format: "html" };
}

export function sanitizeCanonicalHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, canonicalSanitizeOptions).trim();
}

export async function markdownToCanonicalHtml(markdown: string): Promise<string> {
  if (!markdown.trim()) return "";
  const html = await marked.parse(markdown, { gfm: true, breaks: true });
  return sanitizeCanonicalHtml(html);
}

export function renderMiniProgramHtml(
  html: string,
  options: MiniProgramRenderOptions = {}
): { html: string; relatedLinks: RelatedExperienceLink[] } {
  const canonicalHtml = sanitizeCanonicalHtml(html);
  const normalizedHtml = normalizeLeadingContent(canonicalHtml, options);
  const styledHtml = sanitizeHtml(normalizedHtml, miniProgramSanitizeOptions);
  return extractRelatedLinks(styledHtml);
}
