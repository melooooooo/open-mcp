"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { DataTable } from "@/components/admin/data-table"
import { trpc } from "@/lib/trpc/client"

import { columns } from "../components/columns"

const formSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  type: z.enum(["rank", "popular", "new", "related", "category"]),
  status: z.enum(["pending", "active"]),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface RecommendationFormProps {
  recommendation: {
    id: string
    title: string
    type: string
    status: string
    description?: string | null
  }
  apps: {
    id: string
    appId: string
    order: number
    status: string
  }[]
}

export function RecommendationForm({ recommendation, apps }: RecommendationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: recommendation.title,
      type: recommendation.type as FormValues["type"],
      status: recommendation.status as FormValues["status"],
      description: recommendation.description || "",
    },
  })

  const updateRecommendation = trpc.recommendations.update.useMutation({
    onSuccess: () => {
      toast.success("更新成功")
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await updateRecommendation.mutateAsync({
        id: recommendation.id,
        title: values.title,
        type: values.type,
        description: values.description || "",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...(form as any)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>标题</FormLabel>
                  <FormControl>
                    <Input placeholder="输入标题" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>类型</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="rank">排行</SelectItem>
                      <SelectItem value="popular">热门</SelectItem>
                      <SelectItem value="new">最新</SelectItem>
                      <SelectItem value="related">相关</SelectItem>
                      <SelectItem value="category">分类</SelectItem>
                      <SelectItem value="app">应用</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>状态</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">待定</SelectItem>
                      <SelectItem value="active">启用</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="输入描述" {...field} />
                  </FormControl>
                  <FormDescription>可选的描述信息</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </form>
      </Form>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">推荐应用</h3>
        {/* <DataTable data={apps} columns={columns} /> */}
      </div>
    </div>
  )
} 