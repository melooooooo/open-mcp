import { db } from "@repo/db";
import { financeExperiences } from "@repo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../../trpc";

// Sanitize HTML 配置
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "details",
    "summary",
    "input",
    "del",
    "ins",
    "mark",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "id", "style"],
    img: ["src", "alt", "title", "width", "height"],
    a: ["href", "title", "target", "rel"],
    input: ["type", "checked", "disabled"],
    div: ["align"],
    p: ["align"],
    td: ["align"],
    th: ["align"],
    span: ["style"],
  },
  allowedStyles: {
    "*": {
      color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
      "text-align": [/^left$/, /^right$/, /^center$/],
      "background-color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/],
    },
  },
};

/**
 * 将 Markdown 转换为安全的 HTML
 */
async function markdownToSafeHtml(markdown: string): Promise<string> {
  const html = await marked(markdown);
  return sanitizeHtml(html, sanitizeOptions);
}

/**
 * 检查用户是否有权限编辑经验分享
 * - 管理员可以编辑所有内容
 * - 作者可以编辑自己的内容
 */
function canEditExperience(
  userId: string,
  userRole: string | null | undefined,
  experience: { authorUserId: string | null }
): boolean {
  // 管理员可以编辑所有内容
  if (userRole === "admin") {
    return true;
  }
  // 作者可以编辑自己的内容
  if (experience.authorUserId && experience.authorUserId === userId) {
    return true;
  }
  return false;
}

export const experiencesRouter = router({
  /**
   * 检查用户是否有编辑权限
   */
  checkEditPermission: protectedProcedure
    .input(
      z.object({
        experienceId: z.string().uuid().optional(),
        slug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.experienceId && !input.slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "必须提供 experienceId 或 slug",
        });
      }

      // 查询经验分享
      const experience = await db.query.financeExperiences.findFirst({
        where: input.experienceId
          ? eq(financeExperiences.id, input.experienceId)
          : eq(financeExperiences.slug, input.slug!),
        columns: {
          id: true,
          authorUserId: true,
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "经验分享不存在",
        });
      }

      const hasPermission = canEditExperience(
        ctx.user.id,
        ctx.user.role,
        experience
      );

      return {
        hasPermission,
        experienceId: experience.id,
      };
    }),

  /**
   * 获取可编辑的内容
   */
  getEditableContent: protectedProcedure
    .input(
      z.object({
        experienceId: z.string().uuid().optional(),
        slug: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.experienceId && !input.slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "必须提供 experienceId 或 slug",
        });
      }

      // 查询经验分享
      const experience = await db.query.financeExperiences.findFirst({
        where: input.experienceId
          ? eq(financeExperiences.id, input.experienceId)
          : eq(financeExperiences.slug, input.slug!),
        columns: {
          id: true,
          slug: true,
          title: true,
          markdownContent: true,
          metadata: true,
          authorUserId: true,
          lastEditedBy: true,
          lastEditedAt: true,
          coverAssetPath: true,
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "经验分享不存在",
        });
      }

      // 检查权限
      const hasPermission = canEditExperience(
        ctx.user.id,
        ctx.user.role,
        experience
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您没有权限编辑此内容",
        });
      }

      // 获取可编辑的 Markdown 内容
      // 优先使用已编辑的 markdownContent，否则使用原始的 markdown_source
      let editableContent = experience.markdownContent || "";
      if (!editableContent && experience.metadata) {
        const metadata = experience.metadata as Record<string, unknown>;
        const markdownSource = metadata.markdown_source as
          | Record<string, unknown>
          | undefined;
        if (markdownSource?.content) {
          editableContent = markdownSource.content as string;
        }
      }

      return {
        id: experience.id,
        slug: experience.slug,
        title: experience.title,
        markdownContent: editableContent,
        lastEditedBy: experience.lastEditedBy,
        lastEditedAt: experience.lastEditedAt,
        coverAssetPath: experience.coverAssetPath,
      };
    }),

  /**
   * 更新内容
   */
  updateContent: protectedProcedure
    .input(
      z.object({
        experienceId: z.string().uuid(),
        markdownContent: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 查询经验分享
      const experience = await db.query.financeExperiences.findFirst({
        where: eq(financeExperiences.id, input.experienceId),
        columns: {
          id: true,
          authorUserId: true,
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "经验分享不存在",
        });
      }

      // 检查权限
      const hasPermission = canEditExperience(
        ctx.user.id,
        ctx.user.role,
        experience
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您没有权限编辑此内容",
        });
      }

      // 将 Markdown 转换为 HTML
      const contentHtml = await markdownToSafeHtml(input.markdownContent);

      // 更新数据库
      await db
        .update(financeExperiences)
        .set({
          markdownContent: input.markdownContent,
          contentHtml: contentHtml,
          lastEditedBy: ctx.user.id,
          lastEditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(financeExperiences.id, input.experienceId));

      return {
        success: true,
        message: "内容已更新",
      };
    }),

  /**
   * 更新封面图片
   */
  updateCoverImage: protectedProcedure
    .input(
      z.object({
        experienceId: z.string().uuid(),
        coverAssetPath: z.string().url().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 查询经验分享
      const experience = await db.query.financeExperiences.findFirst({
        where: eq(financeExperiences.id, input.experienceId),
        columns: {
          id: true,
          authorUserId: true,
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "经验分享不存在",
        });
      }

      // 检查权限
      const hasPermission = canEditExperience(
        ctx.user.id,
        ctx.user.role,
        experience
      );

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您没有权限编辑此内容",
        });
      }

      // 更新封面图片
      await db
        .update(financeExperiences)
        .set({
          coverAssetPath: input.coverAssetPath,
          lastEditedBy: ctx.user.id,
          lastEditedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(financeExperiences.id, input.experienceId));

      return {
        success: true,
        message: "封面图片已更新",
      };
    }),

  /**
   * 获取经验分享的封面图片
   */
  getCoverImage: publicProcedure
    .input(
      z.object({
        experienceId: z.string().uuid().optional(),
        slug: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      if (!input.experienceId && !input.slug) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "必须提供 experienceId 或 slug",
        });
      }

      const experience = await db.query.financeExperiences.findFirst({
        where: input.experienceId
          ? eq(financeExperiences.id, input.experienceId)
          : eq(financeExperiences.slug, input.slug!),
        columns: {
          id: true,
          coverAssetPath: true,
        },
      });

      if (!experience) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "经验分享不存在",
        });
      }

      return {
        coverAssetPath: experience.coverAssetPath,
      };
    }),
});
