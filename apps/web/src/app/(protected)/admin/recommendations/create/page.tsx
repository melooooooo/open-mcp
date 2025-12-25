"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Category, zRecommendationTypeEnum } from "@repo/db/types"
import { Button } from "@repo/ui/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@repo/ui/components/ui/command"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { cn } from "@repo/ui/lib/utils"
import { Search } from "lucide-react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { trpc } from "@/lib/trpc/client"

const formSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  type: zRecommendationTypeEnum,
  description: z.string().optional(),
  category: z.string().optional(),
  appSlug: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateRecommendationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "popular",
      description: "",
      category: "",
      appSlug: "",
    },
  })

  const { data: categories } = trpc.mcpCategories.getCategories.useQuery({
    type: "application",
  })

  const createRecommendation = trpc.recommendations.create.useMutation({
    onSuccess: () => {
      toast.success("创建成功")
      router.push("/admin/recommendations")
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      await createRecommendation.mutateAsync({
        title: values.title,
        type: values.type,
        description: values.description,
        category: values.type === "category" ? values.category : undefined,
      })
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const type = form.watch("type")

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">创建推荐</h2>
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
                    <SelectItem value="popular">热门</SelectItem>
                    <SelectItem value="new">最新</SelectItem>
                    <SelectItem value="related">相关</SelectItem>
                    <SelectItem value="category">分类</SelectItem>
                    <SelectItem value="similar">相似</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>推荐列表的类型</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === "category" && (
            <FormField
              control={form.control as any}
              name="category"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>分类</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? categories?.find(
                              (category) => category.id === field.value
                            )?.name
                            : "选择分类"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="搜索分类..." />
                        <CommandEmpty>未找到分类</CommandEmpty>
                        <CommandGroup>
                          {categories?.map((category) => (
                            <CommandItem
                              value={category.name}
                              key={category.id}
                              onSelect={() => {
                                form.setValue("category", category.id)
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  category.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>选择推荐所属的分类</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
              {isSubmitting ? "创建中..." : "创建"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 