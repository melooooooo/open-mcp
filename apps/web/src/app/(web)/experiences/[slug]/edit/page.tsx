"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { MarkdownEditor } from "@repo/ui/components/markdown/markdown-editor";
import { Button } from "@repo/ui/components/ui/button";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { ArrowLeft, Loader2, ImagePlus, X, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { uploadToR2 } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ExperienceEditPage({ params }: PageProps) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverImageError, setCoverImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  );

  // 当数据加载完成时，设置初始内容
  useEffect(() => {
    if (experience?.markdownContent) {
      setMarkdownContent(experience.markdownContent);
    }
    if (experience?.coverAssetPath) {
      setCoverImage(experience.coverAssetPath);
      setCoverImageError(false); // 重置错误状态
    }
  }, [experience?.markdownContent, experience?.coverAssetPath]);

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

  // 更新封面图片 mutation
  const updateCoverMutation = trpc.experiences.updateCoverImage.useMutation({
    onSuccess: () => {
      toast.success("封面图片已更新");
    },
    onError: (error) => {
      toast.error("更新封面失败", {
        description: error.message || "更新封面图片时发生错误",
      });
    },
  });

  // 处理封面图片上传
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !experience?.id) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过 5MB");
      return;
    }

    setIsUploadingCover(true);
    try {
      const result = await uploadToR2(file, "experience-covers");
      if (result.success && result.url) {
        setCoverImage(result.url);
        setCoverImageError(false); // 重置错误状态
        // 保存到数据库
        updateCoverMutation.mutate({
          experienceId: experience.id,
          coverAssetPath: result.url,
        });
      } else {
        toast.error(result.error || "上传失败");
      }
    } catch (error) {
      toast.error("上传失败，请重试");
    } finally {
      setIsUploadingCover(false);
      // 清空 input 以便可以再次选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 删除封面图片
  const handleRemoveCover = () => {
    if (!experience?.id) return;
    setCoverImage(null);
    updateCoverMutation.mutate({
      experienceId: experience.id,
      coverAssetPath: null,
    });
  };

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

      {/* 封面图片上传区域 */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <h3 className="mb-3 font-semibold flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
          文章封面图片
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          上传一张封面图片，将在文章列表中展示。推荐尺寸：800×500 像素，最大 5MB。
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        {coverImage && !coverImageError ? (
          <div className="relative group">
            <div className="relative w-full max-w-md aspect-[16/10] rounded-lg overflow-hidden border bg-muted">
              <Image
                src={coverImage}
                alt="封面图片"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
                onError={() => setCoverImageError(true)}
              />
            </div>
            <div className="absolute inset-0 max-w-md aspect-[16/10] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCover}
              >
                <Upload className="h-4 w-4 mr-1" />
                更换
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveCover}
                disabled={isUploadingCover || updateCoverMutation.isPending}
              >
                <X className="h-4 w-4 mr-1" />
                删除
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => !isUploadingCover && fileInputRef.current?.click()}
            className="w-full max-w-md aspect-[16/10] rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 bg-muted/30"
          >
            {isUploadingCover ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">上传中...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">点击上传封面图片</span>
                <span className="text-xs text-muted-foreground/70">支持 JPG、PNG、GIF 格式</span>
              </>
            )}
          </div>
        )}
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
