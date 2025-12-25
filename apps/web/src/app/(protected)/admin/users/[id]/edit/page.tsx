"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { zUserRoleEnum } from "@repo/db/types"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { use, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { FormSection } from "@/components/admin/form-section"
import { PageHeader } from "@/components/admin/page-header"
import { trpc } from "@/lib/trpc/client"

// 表单验证模式
const formSchema = z.object({
  name: z.string().min(2, "姓名至少需要2个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号").optional(),
  role: zUserRoleEnum,
  banned: z.boolean(),
  location: z.string().optional(),
  bio: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  website: z.string().url("请输入有效的网址").optional().or(z.literal("")),
  github: z.string().url("请输入有效的GitHub地址").optional().or(z.literal("")),
  twitter: z.string().url("请输入有效的Twitter地址").optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id: userId } = use(params)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: user, isLoading } = trpc.users.getById.useQuery({ id: userId }, { enabled: !!userId })
  const { mutate: updateUser, isPending } = trpc.users.update.useMutation()

  // Initialize form with default empty values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "user",
      banned: false,
      location: "",
      bio: "",
      company: "",
      position: "",
      website: "",
      github: "",
      twitter: "",
    },
  })

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      const safeUser = user as any;
      form.reset({
        name: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
        role: (user.role || "user") as "admin" | "user",
        banned: user.banned || false,
        location: safeUser.location || "",
        bio: safeUser.bio || "",
        company: safeUser.company || "",
        position: safeUser.position || "",
        website: safeUser.website || "",
        github: safeUser.github || "",
        twitter: safeUser.twitter || "",
      })
    }
  }, [user, form])

  if (isLoading) {
    return <div>加载中...</div>
  }

  if (!user && !isLoading) {
    return <div>用户不存在</div>
  }

  // 提交表单
  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      await updateUser({
        id: userId,
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        role: values.role,
        banned: values.banned,
        location: values.location || undefined,
        bio: values.bio || undefined,
        company: values.company || undefined,
        position: values.position || undefined,
        website: values.website || undefined,
        github: values.github || undefined,
        twitter: values.twitter || undefined,
      } as any)

      toast.success("用户更新成功", {
        description: "用户信息已成功更新。",
      })

      router.push(`/admin/users/${userId}`)
    } catch (error) {
      toast.error("更新失败", {
        description: "更新用户信息时出错，请重试。"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="编辑用户"
        description="修改用户信息和权限"
        actions={
          <Button variant="outline" asChild>
            <Link href={`/admin/users/${userId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Link>
          </Button>
        }
      />

      <Form {...(form as any)}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <FormSection title="基本信息" description="用户的基本个人信息">
                  <div className="flex justify-center mb-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
                      <AvatarFallback>{user?.name?.charAt(0) ?? ""}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control as any}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>姓名</FormLabel>
                          <FormControl>
                            <Input placeholder="输入用户姓名" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>邮箱</FormLabel>
                          <FormControl>
                            <Input placeholder="输入用户邮箱" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>手机号</FormLabel>
                          <FormControl>
                            <Input placeholder="输入用户手机号" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>位置</FormLabel>
                          <FormControl>
                            <Input placeholder="输入用户所在地" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>简介</FormLabel>
                          <FormControl>
                            <Textarea placeholder="输入用户简介" className="resize-none" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </FormSection>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <FormSection title="账户设置" description="用户的角色和状态">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control as any}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>角色</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择用户角色" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">管理员</SelectItem>
                                <SelectItem value="user">普通用户</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>管理员可以访问所有管理功能，普通用户只能访问有限功能。</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="banned"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>状态</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value === "true")}
                              value={field.value ? "true" : "false"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择用户状态" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="false">正常</SelectItem>
                                <SelectItem value="true">已禁用</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>禁用的用户将无法登录系统。</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormSection>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <FormSection title="工作信息" description="用户的职业信息">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control as any}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>公司</FormLabel>
                            <FormControl>
                              <Input placeholder="输入用户所在公司" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>职位</FormLabel>
                            <FormControl>
                              <Input placeholder="输入用户职位" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormSection>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <FormSection title="社交信息" description="用户的社交媒体链接">
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control as any}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>个人网站</FormLabel>
                            <FormControl>
                              <Input placeholder="输入用户个人网站" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control as any}
                        name="github"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <Input placeholder="输入用户GitHub地址" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormSection>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href={`/admin/users/${userId}`}>取消</Link>
            </Button>
            <Button type="submit" disabled={isLoading || isPending} className="flex items-center">
              {isPending || isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存更改
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

