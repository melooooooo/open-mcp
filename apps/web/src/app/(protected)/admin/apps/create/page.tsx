"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { type Control, type FieldPath, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { FormSection } from "@/components/admin/form-section"
import { PageHeader } from "@/components/admin/page-header"
import { FormFileUpload } from "@/components/file-uploader";
import { trpc } from "@/lib/trpc/client";
// 表单验证模式
const formSchema = z.object({
  name: z
    .string()
    .min(2, "应用名称至少需要2个字符")
    .max(255, "应用名称不能超过255个字符"),
  slug: z
    .string()
    .min(2, "标识符至少需要2个字符")
    .max(255, "标识符不能超过255个字符")
    .regex(/^[a-z0-9-]+$/, "标识符只能包含小写字母、数字和连字符"),
  type: z.enum(["client", "server", "application"], {
    required_error: "请选择应用类型",
  }),
  description: z
    .string()
    .min(10, "描述至少需要10个字符")
    .max(500, "描述不能超过500个字符"),
  longDescription: z
    .string()
    .max(2000, "详细描述不能超过2000个字符")
    .optional(),
  website: z
    .string()
    .url({ message: "请输入有效的URL" })
    .optional()
    .or(z.literal("")),
  github: z
    .string()
    .url({ message: "请输入有效的URL" })
    .optional()
    .or(z.literal("")),
  docs: z
    .string()
    .url({ message: "请输入有效的URL" })
    .optional()
    .or(z.literal("")),
  version: z
    .string()
    .max(50, "版本号不能超过50个字符")
    .optional()
    .or(z.literal("")),
  license: z
    .string()
    .max(255, "许可证不能超过255个字符")
    .optional()
    .or(z.literal("")),
  featured: z.boolean().default(false),
  categoryIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  scenario: z
    .string()
    .max(50, "场景不能超过50个字符")
    .optional()
    .or(z.literal(""))
})

type FormValues = z.infer<typeof formSchema>;

type FieldProps<T> = {
  control: Control<FormValues>;
  name: FieldPath<FormValues>;
  value?: T;
}

const FormTextField = ({ control, name, label, description, placeholder }: FieldProps<string> & {
  label: string;
  description?: string;
  placeholder?: string;
}) => (
  <FormField
    control={control as any}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input placeholder={placeholder} {...field} value={field.value as string} />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

const FormTextArea = ({ control, name, label, description, placeholder }: FieldProps<string> & {
  label: string;
  description?: string;
  placeholder?: string;
}) => (
  <FormField
    control={control as any}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Textarea placeholder={placeholder} {...field} value={field.value as string} />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

const FormSelect = ({ control, name, label, description, options }: FieldProps<string> & {
  label: string;
  description?: string;
  options: { value: string; label: string }[];
}) => (
  <FormField
    control={control as any}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <Select onValueChange={field.onChange} value={field.value as string}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

const FormCheckbox = ({ control, name, label, description }: FieldProps<boolean> & {
  label: string;
  description?: string;
}) => (
  <FormField
    control={control as any}
    name={name as any}
    render={({ field }) => (
      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
        <FormControl>
          <Checkbox
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
          />
        </FormControl>
        <div className="space-y-1 leading-none">
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
        </div>
      </FormItem>
    )}
  />
)

const FormMultiCheckbox = ({ control, name, label, description, options }: FieldProps<string[]> & {
  label: string;
  description?: string;
  options: { id: string; name: string; description?: string }[];
}) => (
  <FormField
    control={control as any}
    name={name as any}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <div className="space-y-2">
          {options.map((option) => (
            <FormItem key={option.id} className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={(field.value as string[])?.includes(option.id)}
                  onCheckedChange={(checked) => {
                    const currentValues = field.value as string[] || [];
                    if (checked) {
                      field.onChange([...currentValues, option.id]);
                    } else {
                      field.onChange(currentValues.filter((value) => value !== option.id));
                    }
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-medium">{option.name}</FormLabel>
                {option.description && <FormDescription className="text-xs">{option.description}</FormDescription>}
              </div>
            </FormItem>
          ))}
        </div>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    )}
  />
)

export default function CreateAppPage() {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [iconAssetId, setIconAssetId] = useState<string | null>(null);
  const [bannerAssetId, setBannerAssetId] = useState<string | null>(null);

  // 表单定义
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      type: "client",
      description: "",
      longDescription: "",
      website: "",
      github: "",
      docs: "",
      version: "",
      license: "",
      featured: false,
      categoryIds: [],
      tagIds: [],
      scenario: "",
    },
  })

  // 监听应用类型变化
  const appType = form.watch("type")
  const { data: categoriesData } = trpc.categories.search.useQuery({
    limit: 100,
    page: 1,
  });

  const { data: availableTags } = trpc.tags.list.useQuery({
    limit: 100,
    page: 1,
    source: "admin",
  });

  const { mutateAsync: createApp } = trpc.apps.create.useMutation({
    onSuccess: () => {
      toast.success("创建成功", {
        description: "应用已成功创建",
      });
      router.push("/admin/apps");
    },
    onError: (error) => {
      toast.error("创建失败", {
        description: error.message || "创建应用时出现错误，请重试",
      });
      setIsSubmitting(false);
    },
  });

  // 处理图标上传完成
  const handleIconUploadComplete = (assetIds: string[]) => {
    setIconAssetId(assetIds[0] || null);
  }

  // 处理封面图上传完成
  const handleBannerUploadComplete = (assetIds: string[]) => {
    setBannerAssetId(assetIds[0] || null);
  }

  // 表单提交处理
  async function onSubmit(values: FormValues) {
    if (!iconAssetId) {
      toast.warning("请上传应用图标", {
        description: "应用图标是必需的",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 处理空字符串为 undefined
      const formData = {
        ...values,
        icon: iconAssetId,
        banner: bannerAssetId || undefined,
        website: values.website || undefined,
        github: values.github || undefined,
        docs: values.docs || undefined,
        version: values.version || undefined,
        license: values.license || undefined,
        scenario: values.scenario || undefined,
        categoryIds: values.categoryIds.length > 0 ? values.categoryIds : undefined,
        tagIds: values.tagIds.length > 0 ? values.tagIds : undefined,
      };

      await createApp(formData);
    } catch (error) {
      toast.error("创建失败", {
        description: error instanceof Error ? error.message : "创建应用时出现错误，请重试"
      });
      setIsSubmitting(false);
    }
  }

  // 自动生成标识符
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  }

  // 当名称变化时，自动更新标识符（如果标识符为空）
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    const currentSlug = form.getValues("slug");
    if (!currentSlug) {
      const slug = generateSlug(name);
      form.setValue("slug", slug);
    }
  }

  // 模拟标签数据
  // const availableTags = [
  //   { id: "1", value: "ai-assistant", label: "AI 助手" },
  //   { id: "2", value: "database", label: "数据库" },
  //   { id: "3", value: "natural-language", label: "自然语言" },
  //   { id: "4", value: "code-editor", label: "代码编辑器" },
  //   { id: "5", value: "redis", label: "Redis" },
  //   { id: "6", value: "postgres", label: "Postgres" },
  //   { id: "7", value: "open-source", label: "开源" },
  // ]

  // 模拟服务器场景数据
  const serverScenarios = [
    { id: "database", label: "数据库" },
    { id: "content", label: "内容管理" },
    { id: "web", label: "Web服务" },
    { id: "chat", label: "对话服务" },
    { id: "analytics", label: "数据分析" },
  ]

  // 处理分类选择
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const currentCategories = form.getValues("categoryIds") || [];
    if (checked) {
      form.setValue("categoryIds", [...currentCategories, categoryId]);
    } else {
      form.setValue("categoryIds", currentCategories.filter(id => id !== categoryId));
    }
  };

  // 处理标签选择
  const handleTagChange = (tagId: string, checked: boolean) => {
    const currentTags = form.getValues("tagIds") || [];
    if (checked) {
      form.setValue("tagIds", [...currentTags, tagId]);
    } else {
      form.setValue("tagIds", currentTags.filter(id => id !== tagId));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="添加应用"
        description="创建新的应用"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/apps">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Link>
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "保存中..." : "保存应用"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <Form {...(form as any)}>
              <form className="space-y-8">
                <FormSection title="基本信息" description="设置应用的基本信息">
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 items-start">
                    <div className="flex flex-col gap-4">
                      <FormFileUpload
                        label="应用图标 *"
                        description="上传应用的图标"
                        recommendedSize="512x512px"
                        multiple={false}
                        assetType="icon"
                        onUploadComplete={handleIconUploadComplete}
                        maxSize={2 * 1024 * 1024} // 2MB
                      />

                      <FormFileUpload
                        label="应用封面"
                        description="上传应用的封面图"
                        recommendedSize="1200x630px"
                        multiple={false}
                        assetType="banner"
                        onUploadComplete={handleBannerUploadComplete}
                        maxSize={5 * 1024 * 1024} // 5MB
                      />
                    </div>
                    <div className="space-y-4">
                      <FormTextField control={form.control as any} name="name" label="应用名称 *" description="应用的显示名称" placeholder="输入应用名称" />

                      <FormTextField control={form.control as any} name="slug" label="标识符 *" description="应用的唯一标识符，用于URL和API，只能包含小写字母、数字和连字符" placeholder="输入标识符" />
                      <FormCheckbox control={form.control as any} name="featured" label="推荐应用" description="将此应用标记为推荐应用" />
                      <FormSelect
                        control={form.control as any}
                        name="type"
                        label="应用类型 *"
                        description="选择应用的类型"
                        options={[
                          { value: "client", label: "客户端" },
                          { value: "server", label: "服务端" },
                          { value: "application", label: "应用程序" },
                        ]}
                      />

                      {appType === "server" && (
                        <FormField
                          control={form.control as any}
                          name="scenario"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>应用场景</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择应用场景" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {serverScenarios.map((scenario) => (
                                    <SelectItem key={scenario.id} value={scenario.id}>
                                      {scenario.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>选择服务器应用的主要场景</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  <FormTextArea control={form.control as any} name="description" label="简短描述 *" description="简短描述应用的主要功能和特点（最多500个字符）" placeholder="输入应用的简短描述" />

                  <FormTextArea
                    control={form.control as any}
                    name="longDescription"
                    label="详细描述"
                    description="详细描述应用的功能、特点和使用场景（最多2000个字符）"
                    placeholder="输入应用的详细描述（可选）"
                  />
                </FormSection>

                <FormSection title="链接和版本" description="设置应用的相关链接和版本信息">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormTextField control={form.control as any} name="website" label="官方网站" description="应用的官方网站" placeholder="https://example.com" />

                    <FormTextField control={form.control as any} name="github" label="GitHub 仓库" description="应用的GitHub仓库" placeholder="https://github.com/username/repo" />

                    <FormTextField control={form.control as any} name="docs" label="文档链接" description="应用的文档链接" placeholder="https://docs.example.com" />

                    <FormTextField control={form.control as any} name="version" label="版本" description="应用的版本" placeholder="1.0.0" />

                    <FormTextField control={form.control as any} name="license" label="许可证" description="应用的许可证" placeholder="MIT, Apache-2.0, 专有软件等" />
                  </div>
                </FormSection>

                <FormSection title="分类和标签" description="选择应用的分类和标签">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <FormLabel>分类 *</FormLabel>
                      <FormDescription>选择应用所属的分类</FormDescription>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoriesData?.data && (
                          <FormMultiCheckbox
                            control={form.control as any}
                            name="categoryIds"
                            label="分类"
                            options={categoriesData.data.map((category) => ({
                              id: category.id,
                              name: category.name,
                              description: category.description || undefined,
                            }))}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <FormLabel>标签</FormLabel>
                      <FormDescription>选择应用的标签</FormDescription>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableTags?.data && (
                          <FormMultiCheckbox
                            control={form.control as any}
                            name="tagIds"
                            label="标签"
                            options={availableTags.data.map((tag) => ({
                              id: tag.id,
                              name: tag.name,
                              description: tag.description || undefined,
                            }))}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </FormSection>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

