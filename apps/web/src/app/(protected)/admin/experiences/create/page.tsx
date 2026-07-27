"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { trpc } from "@/lib/trpc/client"

const formSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  authorName: z.string().optional(),
  organizationName: z.string().optional(),
  articleType: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  tagsInput: z.string().optional(),
  summary: z.string().optional(),
  markdownContent: z.string().optional(),
  isPinned: z.boolean().optional(),
  isHot: z.boolean().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateExperiencePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      authorName: "",
      organizationName: "",
      articleType: "",
      jobTitle: "",
      industry: "",
      tagsInput: "",
      summary: "",
      markdownContent: "",
      isPinned: false,
      isHot: false,
    },
  })

  const createExperience = trpc.adminExperiences.create.useMutation({
    onSuccess: (data) => {
      toast.success("创建成功", { description: "经验分享文章已创建" })
      router.push("/admin/experiences")
    },
    onError: (error) => {
      toast.error("创建失败", { description: error.message })
      setIsSubmitting(false)
    },
  })

  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true)

    const tags = values.tagsInput
      ? values.tagsInput
          .split(/[,，]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined

    createExperience.mutate({
      title: values.title,
      authorName: values.authorName || undefined,
      organizationName: values.organizationName || undefined,
      articleType: values.articleType || undefined,
      jobTitle: values.jobTitle || undefined,
      industry: values.industry || undefined,
      tags,
      summary: values.summary || undefined,
      markdownContent: values.markdownContent || undefined,
      isPinned: values.isPinned,
      isHot: values.isHot,
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="新建经验分享"
        description="创建一篇新的经验分享文章，创建后可跳转到前台编辑页继续编辑正文"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/experiences">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回列表
              </Link>
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? "创建中..." : "创建文章"}
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <FormField
                    control={form.control as any}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>文章标题 *</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入文章标题" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="authorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>作者名</FormLabel>
                        <FormControl>
                          <Input placeholder="作者名称" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>机构名称</FormLabel>
                        <FormControl>
                          <Input placeholder="所属机构 / 公司" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>岗位名称</FormLabel>
                        <FormControl>
                          <Input placeholder="相关岗位" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control as any}
                    name="articleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>文章类型</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="interview">面经</SelectItem>
                            <SelectItem value="guide">攻略</SelectItem>
                            <SelectItem value="review">点评</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>行业</FormLabel>
                        <FormControl>
                          <Input placeholder="如：银行、券商、基金..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="tagsInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标签</FormLabel>
                        <FormControl>
                          <Input placeholder="用逗号分隔，如：秋招,面试,银行" {...field} />
                        </FormControl>
                        <FormDescription>多个标签用中英文逗号分隔</FormDescription>
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center gap-6 pt-2">
                    <FormField
                      control={form.control as any}
                      name="isPinned"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">置顶</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="isHot"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">热门</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control as any}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>文章摘要</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="简要描述文章内容（可选，不填则从正文自动截取）"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="markdownContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Markdown 正文</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="支持 Markdown 格式，创建后也可在前台编辑页中修改"
                        rows={12}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      创建后可通过列表页的「编辑文章」跳转到前台编辑器继续编辑
                    </FormDescription>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
