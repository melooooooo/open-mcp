import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  markdownToCanonicalHtml,
  renderMiniProgramHtml,
  resolveExperienceSource,
  sanitizeCanonicalHtml,
  type ExperienceContentSource,
} from "../common/experience-content";

const migrationDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(migrationDirectory, "../../..");
loadEnvironmentFile(path.join(repositoryRoot, ".env.local"));
loadEnvironmentFile(path.join(repositoryRoot, ".env"));

type Database = (typeof import("@repo/db"))["db"];
type FinanceExperiences = (typeof import("@repo/db/schema"))["financeExperiences"];

type MigrationReport = {
  id: string;
  slug: string | null;
  source: ExperienceContentSource;
  markdownLength: number;
  htmlLength: number;
  miniHtmlLength: number;
  imageCount: number;
  httpsLinkCount: number;
  relatedLinkCount: number;
  unsafeOutput: boolean;
  changes: string[];
};

const shouldApply = process.argv.includes("--apply");

function loadEnvironmentFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1] || ""] !== undefined) continue;

    const key = match[1];
    let value = match[2] || "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) process.env[key] = value;
  }
}

function countMatches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

async function buildReports(
  db: Database,
  financeExperiences: FinanceExperiences
) {
  const rows = await db
    .select({
      id: financeExperiences.id,
      slug: financeExperiences.slug,
      title: financeExperiences.title,
      coverAssetPath: financeExperiences.coverAssetPath,
      markdownContent: financeExperiences.markdownContent,
      contentHtml: financeExperiences.contentHtml,
      metadata: financeExperiences.metadata,
    })
    .from(financeExperiences);

  const reports: Array<MigrationReport & { markdown: string | null; html: string }> = [];

  for (const row of rows) {
    const resolved = resolveExperienceSource(row);
    const markdown = resolved.format === "markdown" ? resolved.value : null;
    const html = markdown
      ? await markdownToCanonicalHtml(markdown)
      : sanitizeCanonicalHtml(resolved.value);
    const miniProgramContent = renderMiniProgramHtml(html, {
      title: row.title,
      coverAssetPath: row.coverAssetPath,
    });
    const changes: string[] = [];

    if (resolved.source === "legacy_markdown") changes.push("backfill_markdown");
    if ((row.contentHtml || "") !== html) changes.push("regenerate_html");

    reports.push({
      id: row.id,
      slug: row.slug,
      source: resolved.source,
      markdownLength: markdown?.length || 0,
      htmlLength: html.length,
      miniHtmlLength: miniProgramContent.html.length,
      imageCount: countMatches(markdown || html, /!\[[^\]]*\]\([^)]+\)|<img\b/gi),
      httpsLinkCount: countMatches(markdown || html, /(?<!!)\[[^\]]+\]\(https:\/\/[^)]+\)|<a\b[^>]*href=["']https:\/\//gi),
      relatedLinkCount: miniProgramContent.relatedLinks.length,
      unsafeOutput: /javascript:|data:image|<script\b|\son\w+=/i.test(
        miniProgramContent.html
      ),
      changes,
      markdown,
      html,
    });
  }

  return reports;
}

async function main() {
  const [{ db }, { financeExperiences }, { eq }] = await Promise.all([
    import("@repo/db"),
    import("@repo/db/schema"),
    import("drizzle-orm"),
  ]);
  const reports = await buildReports(db, financeExperiences);
  const changed = reports.filter((report) => report.changes.length > 0);
  const invalid = reports.filter(
    (report) => report.miniHtmlLength === 0 || report.unsafeOutput
  );

  console.table(
    reports.map(({ markdown: _markdown, html: _html, ...report }) => ({
      ...report,
      changes: report.changes.join(",") || "none",
    }))
  );
  console.log(
    JSON.stringify(
      {
        mode: shouldApply ? "apply" : "dry-run",
        total: reports.length,
        changed: changed.length,
        invalid: invalid.length,
        relatedLinks: reports.reduce(
          (total, report) => total + report.relatedLinkCount,
          0
        ),
        sources: Object.fromEntries(
          ["markdown_content", "legacy_markdown", "content_html", "empty"].map(
            (source) => [
              source,
              reports.filter((report) => report.source === source).length,
            ]
          )
        ),
      },
      null,
      2
    )
  );

  if (invalid.length) {
    throw new Error(
      `Validation failed for ${invalid.length} experience content records`
    );
  }

  if (!shouldApply) {
    console.log("Dry-run only. Re-run with --apply to update the database.");
    return;
  }

  await db.transaction(async (tx) => {
    for (const report of changed) {
      const values: {
        contentHtml: string;
        markdownContent?: string;
        updatedAt: Date;
      } = {
        contentHtml: report.html,
        updatedAt: new Date(),
      };
      if (report.source === "legacy_markdown" && report.markdown) {
        values.markdownContent = report.markdown;
      }

      await tx
        .update(financeExperiences)
        .set(values)
        .where(eq(financeExperiences.id, report.id));
    }
  });

  console.log(`Applied ${changed.length} experience content updates.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Experience content migration failed:", error);
    process.exit(1);
  });
