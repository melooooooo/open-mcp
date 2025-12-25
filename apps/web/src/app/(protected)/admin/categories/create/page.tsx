"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Category } from "@repo/db/types"
import { Button } from "@repo/ui/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { slugify } from "inngest/helpers/strings"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { useComputedField } from "@/hooks/use-computed-field"
import { trpc } from "@/lib/trpc/client"

// 表单验证模式
const formSchema = z.object({
  name: z.string().min(2, "分类名称至少需要2个字符").max(50, "分类名称不能超过50个字符"),
  slug: z.string().min(2, "分类标识至少需要2个字符").max(50, "分类标识不能超过50个字符")
    .regex(/^[a-z0-9-]+$/, "分类标识只能包含小写字母、数字和连字符"),
  description: z.string().max(500, "描述不能超过500个字符").optional(),
  parentId: z.string().nullable(),
})

type FormValues = z.infer<typeof formSchema>

export default function CategoryCreatePage() {
  const router = useRouter()
  // 使用 tRPC 获取所有分类（用于选择父分类）
  const { data: categories, isLoading: isLoadingCategories } = trpc.categories.search.useQuery({
    limit: 100,
    page: 1,
  })

  // 使用 tRPC 创建分类
  const { mutate: createCategory, isPending: isCreating } = trpc.categories.create.useMutation({
    onSuccess: (data) => {
      toast.success("创建成功", {
        description: "分类已成功创建",
      });
      router.push(`/admin/categories/${data?.id}`);
    },
    onError: (error) => {
      toast.error("创建失败", {
        description: error.message
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
  })

  // Set the slug based on the name
  useComputedField({
    form,
    sourceField: 'name',
    computedField: 'slug',
    callback: slugify,
  });

  // 处理表单提交
  const onSubmit = (values: FormValues) => {
    // 检查name和slug是否与其他分类重复
    const isNameDuplicate = categories?.data.some(
      (c) => c.name === values.name
    );

    const isSlugDuplicate = categories?.data.some(
      (c) => c.slug === values.slug
    );

    if (isNameDuplicate) {
      toast.success("创建失败", {
        description: "分类名称已存在，请使用其他名称"
      });
      return;
    }

    if (isSlugDuplicate) {
      toast.error("创建失败", {
        description: "分类标识已存在，请使用其他标识"
      });
      return;
    }

    createCategory(values)
  }

  // 自动生成 slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue("name", name)

    // 生成 slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    form.setValue("slug", slug)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="创建分类"
        description="创建新的分类"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
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
                  <Input
                    placeholder="输入分类名称"
                    {...field}
                    onChange={handleNameChange}
                  />
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
                    {categories?.data.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
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
              onClick={() => router.push("/admin/categories")}
            >
              取消
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "创建中..." : "创建分类"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

