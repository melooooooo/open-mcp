"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Category } from "@repo/db/types";
import { Button } from "@repo/ui/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { trpc } from "@/lib/trpc/client";

// 表单验证模式
const formSchema = z.object({
  name: z.string().min(2, "分类名称至少需要2个字符").max(50, "分类名称不能超过50个字符"),
  slug: z.string().min(2, "分类标识至少需要2个字符").max(50, "分类标识不能超过50个字符")
    .regex(/^[a-z0-9-]+$/, "分类标识只能包含小写字母、数字和连字符"),
  description: z.string().max(500, "描述不能超过500个字符").optional(),
  parentId: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();

  const { id } = use(params);

  // 使用 tRPC 获取分类详情
  const {
    data: category,
    isLoading: isLoadingCategory,
    error: categoryError,
  } = trpc.categories.getById.useQuery({ id });

  // 使用 tRPC 获取所有分类（用于选择父分类）
  const {
    data: categories,
    isLoading: isLoadingCategories,
  } = trpc.categories.search.useQuery({
    limit: 100,
    page: 1,
  });

  // 使用 tRPC 更新分类
  const { mutate: updateCategory, isPending: isUpdating } = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("更新成功", {
        description: "分类信息已更新",
      });
      router.push(`/admin/categories/${id}`);
    },
    onError: (error) => {
      toast.error("更新失败", {
        description: error.message,
      });
    },
  });

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      parentId: null,
    },
  });

  // 当分类数据加载完成后，设置表单默认值
  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        parentId: category.parentId || null,
      });
    }
  }, [category, form]);

  // 处理表单提交
  const onSubmit = (values: FormValues) => {
    // 检查name和slug是否与其他分类重复
    const isNameDuplicate = categories?.data.some(
      (c) => c.id !== id && c.name === values.name
    );

    const isSlugDuplicate = categories?.data.some(
      (c) => c.id !== id && c.slug === values.slug
    );

    if (isNameDuplicate) {
      toast.error("更新失败", {
        description: "分类名称已存在，请使用其他名称",
      });
      return;
    }

    if (isSlugDuplicate) {
      toast.error("更新失败", {
        description: "分类标识已存在，请使用其他标识",
      });
      return;
    }

    updateCategory({
      id,
      ...values,
    });
  };

  // 自动生成 slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    // 只有当slug为空或者slug是由name自动生成的时候才自动更新slug
    const currentSlug = form.getValues("slug");
    if (!currentSlug || currentSlug === form.getValues("name").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) {
      // 生成 slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      form.setValue("slug", slug);
    }
  };

  // 错误处理
  if (categoryError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium">加载失败</h3>
          <p className="text-sm text-muted-foreground">{categoryError.message}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/admin/categories")}
          >
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  // 加载状态
  if (isLoadingCategory || isLoadingCategories) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="编辑分类"
          description="修改分类信息"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/admin/categories/${id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回详情
                </Link>
              </Button>
              <Skeleton className="h-10 w-24" />
            </div>
          }
        />

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // 分类不存在
  if (!category) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-medium">分类不存在</h3>
          <p className="text-sm text-muted-foreground">请求的分类不存在或已被删除</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/admin/categories")}
          >
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="编辑分类"
        description="修改分类信息"
        actions={
          <Button variant="outline" asChild>
            <Link href={`/admin/categories/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回详情
            </Link>
          </Button>
        }
      />

      <Form {...(form as any)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control as any}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分类名称</FormLabel>
                <FormControl>
                  <Input placeholder="输入分类名称" {...field} onChange={handleNameChange} />
                </FormControl>
                <FormDescription>
                  分类的显示名称，将用于展示给用户。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分类标识</FormLabel>
                <FormControl>
                  <Input placeholder="输入分类标识" {...field} />
                </FormControl>
                <FormDescription>
                  分类的唯一标识，只能包含小写字母、数字和连字符。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>描述</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="输入分类描述"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  分类的详细描述，帮助用户理解分类的用途。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>父分类</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择父分类" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="-1">无父分类</SelectItem>
                    {categories?.data
                      ?.filter((c) => c.id !== id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择父分类以创建分类层级结构。如果不选择，则创建顶级分类。
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/categories/${id}`)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "保存中..." : "保存更改"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
