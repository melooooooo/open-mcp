"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { MarkdownEditor } from "@repo/ui/components/markdown/markdown-editor";
import { Button } from "@repo/ui/components/ui/button";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ExperienceEditPage({ params }: PageProps) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");

  // 解析 params，并解码 URL 编码的 slug
  useEffect(() => {
    params.then((p) => {
      // URL 解码 slug，因为数据库中存储的是解码后的中文字符
      const decodedSlug = decodeURIComponent(p.slug);
      setSlug(decodedSlug);
    });
  }, [params]);

  // 获取可编辑内容
  const {
    data: experience,
    isLoading,
    error,
  } = trpc.experiences.getEditableContent.useQuery(
    { slug },
    {
      enabled: !!slug,
      onSuccess: (data) => {
        setMarkdownContent(data.markdownContent);
      },
    }
  );

  // 更新内容 mutation
  const updateMutation = trpc.experiences.updateContent.useMutation({
    onSuccess: () => {
      toast.success("保存成功", {
        description: "内容已成功更新",
      });
      router.push(`/experiences/${slug}`);
    },
    onError: (error) => {
      toast.error("保存失败", {
        description: error.message || "保存内容时发生错误",
      });
    },
  });

  const handleSave = () => {
    if (!experience?.id) return;

    updateMutation.mutate({
      experienceId: experience.id,
      markdownContent,
    });
  };

  const handleCancel = () => {
    router.push(`/experiences/${slug}`);
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            加载失败
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "无法加载编辑内容"}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/experiences/${slug}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回详情页
          </Button>
        </div>
      </div>
    );
  }

  // 没有数据
  if (!experience) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">未找到内容</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/experiences")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* 页面头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/experiences/${slug}`}
            className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回详情页
          </Link>
          <h1 className="text-2xl font-bold">{experience.title}</h1>
          {experience.lastEditedAt && (
            <p className="mt-1 text-sm text-muted-foreground">
              最后编辑于{" "}
              {new Date(experience.lastEditedAt).toLocaleString("zh-CN")}
            </p>
          )}
        </div>
      </div>

      {/* Markdown 编辑器 */}
      <MarkdownEditor
        value={markdownContent}
        onChange={setMarkdownContent}
        onSave={handleSave}
        onCancel={handleCancel}
        placeholder="在此输入 Markdown 内容..."
        minHeight="600px"
        saveButtonText={updateMutation.isPending ? "保存中..." : "保存"}
        cancelButtonText="取消"
        isSaving={updateMutation.isPending}
        disabled={updateMutation.isPending}
      />

      {/* 提示信息 */}
      <div className="mt-4 rounded-lg border bg-muted/50 p-4">
        <h3 className="mb-2 font-semibold">编辑提示</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• 使用工具栏快速插入 Markdown 格式</li>
          <li>• 切换到"预览"标签查看渲染效果</li>
          <li>• 支持快捷键：Ctrl/Cmd + S 保存，Ctrl/Cmd + Z 撤销</li>
          <li>• 内容将自动转换为 HTML 并保存</li>
        </ul>
      </div>
    </div>
  );
}
