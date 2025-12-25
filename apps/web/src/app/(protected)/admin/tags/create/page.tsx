"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { FormSection } from "@/components/admin/form-section"
import { PageHeader } from "@/components/admin/page-header"
import { trpc } from "@/lib/trpc/client"

// 表单验证模式
const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "标签名称至少需要2个字符",
    })
    .max(50, {
      message: "标签名称不能超过50个字符",
    }),
  slug: z
    .string()
    .min(2, {
      message: "标识符至少需要2个字符",
    })
    .max(50, {
      message: "标识符不能超过50个字符",
    })
    .regex(/^[a-z0-9-]+$/, {
      message: "标识符只能包含小写字母、数字和连字符",
    }),
  description: z
    .string()
    .max(200, {
      message: "描述不能超过200个字符",
    })
    .optional(),
})

export default function CreateTagPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 使用 tRPC 创建标签
  const { mutate: createTag } = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("标签创建成功", {
        description: "新标签已成功创建",
      })
      router.push("/admin/tags")
    },
    onError: (error) => {
      toast.error("创建失败", {
        description: error.message,
      })
      setIsSubmitting(false)
    },
  })

  // 表单定义
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  })

  // 表单提交处理
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    createTag(values)
  }

  // 自动生成标识符
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  }

  // 当名称变化时，自动更新标识符（如果标识符为空）
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    form.setValue("name", name)

    const currentSlug = form.getValues("slug")
    if (!currentSlug) {
      const slug = generateSlug(name)
      form.setValue("slug", slug)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="添加标签"
        description="创建新的应用标签"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/tags">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回
              </Link>
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "保存中..." : "保存标签"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6">
        <Card>
          <CardContent className="pt-6">
            <Form {...(form as any)}>
              <form className="space-y-8">
                <FormSection title="基本信息" description="设置标签的基本信息">
                  <FormField
                    control={form.control as any}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标签名称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="输入标签名称" {...field} onChange={handleNameChange} />
                        </FormControl>
                        <FormDescription>标签的显示名称，如"AI 助手"、"数据库"等</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标识符 *</FormLabel>
                        <FormControl>
                          <Input placeholder="输入标识符" {...field} />
                        </FormControl>
                        <FormDescription>
                          标签的唯一标识符，用于URL和API，只能包含小写字母、数字和连字符
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
                          <Textarea placeholder="输入标签描述（可选）" {...field} />
                        </FormControl>
                        <FormDescription>简短描述此标签的用途和适用场景</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormSection>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

