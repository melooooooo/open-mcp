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
import { Textarea } from "@repo/ui/components/ui/textarea"
import { useRouter } from "next/navigation"
import { use, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { trpc } from "@/lib/trpc/client"

const formSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function EditRecommendationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params);

  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: recommendation, isPending } = trpc.recommendations.get.useQuery({ id })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      title: recommendation?.title ?? "",
      description: recommendation?.description ?? "",
    },
  })

  const updateRecommendation = trpc.recommendations.update.useMutation({
    onSuccess: () => {
      toast.success("更新成功")
      router.refresh()
      router.back()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (values: FormValues) => {
    if (!recommendation?.id) {
      toast.error("推荐数据不存在")
      return
    }

    try {
      setIsSubmitting(true)
      await updateRecommendation.mutateAsync({
        id: recommendation.id,
        ...values,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPending) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">加载中...</h2>
        </div>
      </div>
    )
  }

  if (!recommendation) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">推荐数据不存在</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">编辑推荐</h2>
      </div>

      <Form {...(form as any)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control as any}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>标题</FormLabel>
                <FormControl>
                  <Input placeholder="请输入标题" {...field} />
                </FormControl>
                <FormDescription>推荐列表的标题</FormDescription>
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
                    placeholder="请输入描述"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>推荐列表的描述信息</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}