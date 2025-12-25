"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { type McpApp,zCreateClaimsFormSchema } from "@repo/db/types"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
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
import { Progress } from "@repo/ui/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Shield } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { AuthCheckWrapper } from "@/components/auth/auth-check-wrapper"
import { trpc } from "@/lib/trpc/client"

interface ClaimAppDialogProps {
  app: McpApp
}

export const zEmailVerificationSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  verificationCode: z.string().length(6, "验证码必须是6位数字").optional(),
})

type EmailVerificationForm = z.infer<typeof zEmailVerificationSchema>
type ClaimForm = z.infer<typeof zCreateClaimsFormSchema>

// 定义申请流程的步骤
type ClaimStep = "email" | "verification" | "details" | "success"

export function ClaimAppDialog({ app }: ClaimAppDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [currentStep, setCurrentStep] = useState<ClaimStep>("email")
  const [countdown, setCountdown] = useState(0)
  const [verificationSent, setVerificationSent] = useState(false)
  const [identifier, setIdentifier] = useState<string>("")

  // tRPC mutations
  const sendMagicLink = trpc.mcpClaims.sendMagicLink.useMutation()
  const verifyMagicLink = trpc.mcpClaims.verifyMagicLink.useMutation()
  const createClaim = trpc.mcpClaims.create.useMutation()

  // 邮箱验证表单
  const emailForm = useForm<EmailVerificationForm>({
    resolver: zodResolver(zEmailVerificationSchema),
    defaultValues: {
      email: "",
      verificationCode: "",
    },
    mode: "onChange", // 添加这行，使表单在值改变时就进行验证
  })

  // 申请详情表单
  const claimForm = useForm<ClaimForm>({
    resolver: zodResolver(zCreateClaimsFormSchema),
    defaultValues: {
      appId: app.id,
      email: "",
      identifier: "",
      proofUrl: "",
      proofType: "github",
      additionalInfo: "",
    },
  })

  // 处理倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown])

  // 发送验证码
  const handleSendVerificationCode = useCallback(async () => {
    const email = emailForm.getValues("email")
    console.warn("[handleSendVerificationCode] [email]", email)
    if (!email) {
      emailForm.trigger("email")
      return
    }

    setIsSendingCode(true)

    try {
      const result = await sendMagicLink.mutateAsync({
        email,
        appId: app.id,
      })
      setIdentifier(result.identifier) //需要回传
      // 更新申请表单中的邮箱
      claimForm.setValue("email", email)

      // 设置验证码已发送状态
      setVerificationSent(true)
      setCountdown(60)

      // 转到验证码输入步骤
      setCurrentStep("verification")

      toast.success(`发送成功`, {
        description: `验证码已发送至 ${email}，请查收`,
      })
    } catch (error) {
      console.warn("[handleSendVerificationCode] [error]", error)
      toast.error("发送失败", {
        description: "验证码发送失败，请稍后重试",
      })
    } finally {
      setIsSendingCode(false)
    }
  }, [emailForm, claimForm, toast, sendMagicLink, app.id])

  // 验证验证码
  const handleVerifyCode = async (values: EmailVerificationForm) => {
    if (!values.verificationCode || values.verificationCode.length !== 6) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await verifyMagicLink.mutateAsync({
        email: values.email,
        code: values.verificationCode,
        appId: app.id,
        identifier: identifier,
      })

      if (result.success) {
        // 更新申请表单中的验证码
        // claimForm.setValue("verificationCode", values.verificationCode)
        claimForm.setValue("email", values.email)

        // 转到详情填写步骤
        setCurrentStep("details")
      }
    } catch (error) {
      toast.error("验证失败", {
        description: "验证码验证失败，请检查后重试",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 提交申请
  const handleSubmitClaim = async (values: ClaimForm) => {
    setIsSubmitting(true)

    try {
      await createClaim.mutateAsync({
        appId: app.id,
        email: values.email,
        proofUrl: values.proofUrl,
        proofType: values.proofType,
        identifier: identifier,
        additionalInfo: values.additionalInfo,
      })

      // 转到成功步骤
      setCurrentStep("success")

      toast("申请已提交", {
        description: "您的应用所有权申请已提交，我们将尽快审核",
      })
    } catch (error) {
      toast("提交失败", {
        description: "申请提交失败，请稍后重试",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 重置对话框状态
  const resetDialog = () => {
    setCurrentStep("email")
    setVerificationSent(false)
    setCountdown(0)
    setIdentifier("")
    emailForm.reset({
      email: "",
      verificationCode: "",
    })
    claimForm.reset({
      appId: app.id,
      email: "",
      identifier: "",
      proofUrl: "",
      proofType: "github",
      additionalInfo: "",
    })
  }

  // 关闭对话框时重置状态
  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (!open) {
      resetDialog()
    }
  }

  // 返回上一步
  const handleBack = () => {
    if (currentStep === "verification") {
      setCurrentStep("email")
    } else if (currentStep === "details") {
      setCurrentStep("verification")
    }
  }

  // 计算进度
  const getProgress = () => {
    switch (currentStep) {
      case "email":
        return 25
      case "verification":
        return 50
      case "details":
        return 75
      case "success":
        return 100
    }
  }

  // 处理打开对话框
  const handleOpenDialog = () => {
    setOpen(true)
  }

  return (
    <AuthCheckWrapper
      onAuthSuccess={handleOpenDialog}
      buttonText={
        <Button variant="outline" size="sm">
          <Shield className="mr-2 h-4 w-4" />
          申请所有权
        </Button>
      }
    >
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
          <div className="pt-6">
            <div className="p-8 pt-6">
              {currentStep !== "success" && (
                <div className="mb-6">
                  <Progress value={getProgress()} className="h-2" />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>验证邮箱</span>
                    <span>输入验证码</span>
                    <span>完善信息</span>
                    <span>完成</span>
                  </div>
                </div>
              )}

              {currentStep === "email" && (
                <>
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl">验证您的邮箱</DialogTitle>
                    <DialogDescription>请输入您的邮箱地址，我们将发送验证码以确认您的身份</DialogDescription>
                  </DialogHeader>

                  <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 text-sm mb-4">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">申请须知</p>
                      <p className="text-muted-foreground">
                        您需要提供能够证明您是该应用所有者或官方代表的证明。请确保使用与应用相关的官方邮箱。
                      </p>
                    </div>
                  </div>

                  <Form {...(emailForm as any)}>
                    <form onSubmit={emailForm.handleSubmit(handleSendVerificationCode)} className="space-y-4">
                      <FormField
                        control={emailForm.control as any}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>邮箱地址 *</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="your@email.com"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e)
                                    // 立即验证邮箱格式
                                    emailForm.trigger("email").then(() => {
                                      console.log("Email validation state:", emailForm.formState.isValid)
                                    })
                                  }}
                                  onBlur={() => {
                                    // 失去焦点时也触发验证
                                    emailForm.trigger("email")
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={handleSendVerificationCode}
                                  // 使用 emailForm.getFieldState 检查特定字段的验证状态
                                  disabled={isSendingCode || !!emailForm.getFieldState("email").error}
                                  className="whitespace-nowrap min-w-[100px]"
                                >
                                  {isSendingCode ? (
                                    <span className="flex items-center">
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      发送中
                                    </span>
                                  ) : (
                                    "发送验证码"
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>请使用与应用相关的官方邮箱</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>

                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      取消
                    </Button>
                  </DialogFooter>
                </>
              )}

              {currentStep === "verification" && (
                <>
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl">输入验证码</DialogTitle>
                    <DialogDescription>请输入发送到 {emailForm.getValues("email")} 的6位验证码</DialogDescription>
                  </DialogHeader>

                  <Form {...(emailForm as any)}>
                    <form onSubmit={emailForm.handleSubmit(handleVerifyCode)} className="space-y-4">
                      <FormField
                        control={emailForm.control as any}
                        name="verificationCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>验证码 *</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="6位验证码"
                                  maxLength={6}
                                  {...field}
                                  onChange={(e) => {
                                    // 只允许输入数字
                                    const value = e.target.value.replace(/\D/g, "")
                                    field.onChange(value)
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={countdown > 0}
                                  onClick={handleSendVerificationCode}
                                  className="whitespace-nowrap"
                                >
                                  {countdown > 0 ? `重新发送(${countdown}s)` : "重新发送"}
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-xs"
                                onClick={() => setCurrentStep("email")}
                              >
                                更换邮箱地址
                              </Button>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter className="flex justify-between sm:justify-between mt-6">
                        <Button type="button" variant="outline" onClick={handleBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          返回
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              验证中
                            </span>
                          ) : (
                            "验证并继续"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </>
              )}

              {currentStep === "details" && (
                <>
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl">完善申请信息</DialogTitle>
                    <DialogDescription>请提供能够证明您是 {app.name} 所有者的相关信息</DialogDescription>
                  </DialogHeader>

                  <Form {...(claimForm as any)}>
                    <form onSubmit={claimForm.handleSubmit(handleSubmitClaim)} className="space-y-4">
                      <FormField
                        control={claimForm.control as any}
                        name="proofType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>证明类型 *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="选择证明类型" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="github">GitHub 仓库所有权</SelectItem>
                                <SelectItem value="website">官方网站管理权限</SelectItem>
                                <SelectItem value="email">官方邮箱验证</SelectItem>
                                <SelectItem value="other">其他证明</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>选择您将提供的所有权证明类型</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={claimForm.control as any}
                        name="proofUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>证明URL *</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormDescription>提供能够证明您所有权的URL链接</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={claimForm.control as any}
                        name="additionalInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>补充信息</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="请提供任何可能有助于验证您所有权的补充信息..."
                                className="resize-none"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>可选，提供额外的信息帮助我们验证您的所有权</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter className="flex justify-between sm:justify-between mt-6">
                        <Button type="button" variant="outline" onClick={handleBack}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          返回
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                          {isSubmitting ? (
                            <span className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              提交中
                            </span>
                          ) : (
                            "提交申请"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </>
              )}

              {currentStep === "success" && (
                <>
                  <DialogHeader className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-300" />
                      </div>
                      <DialogTitle className="text-xl">申请已提交</DialogTitle>
                    </div>
                    <DialogDescription>您的应用所有权申请已成功提交，我们将尽快审核</DialogDescription>
                  </DialogHeader>

                  <div className="bg-muted/50 p-4 rounded-md space-y-3 my-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">应用名称</span>
                      <span className="font-medium">{app.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">申请邮箱</span>
                      <span className="font-medium">{claimForm.getValues("email")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">申请时间</span>
                      <span className="font-medium">{new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">申请状态</span>
                      <span className="font-medium">
                        <Badge variant="secondary">审核中</Badge>
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>我们将通过邮件通知您申请的审核结果。审核通常需要1-3个工作日。</p>
                    <p className="mt-2">如有任何问题，请联系我们的支持团队。</p>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button onClick={() => setOpen(false)}>完成</Button>
                  </DialogFooter>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AuthCheckWrapper>
  )
}
