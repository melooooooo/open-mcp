"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert"
import { Button } from "@repo/ui/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/ui/components/ui/input-otp"
import { CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { authClient } from "@/lib/auth-client"

const passwordLoginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少 8 位"),
})

const otpEmailSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
})

const otpSchema = z.object({
  otp: z.string().length(6, "验证码必须是6位数字"),
})

interface EmailLoginProps {
  onSuccess?: () => void
}

type Mode = "password" | "otp"
type OtpStep = "request" | "verify"

export function EmailLogin({ onSuccess }: EmailLoginProps) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("password")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [otpStep, setOtpStep] = useState<OtpStep>("request")
  const [otpEmail, setOtpEmail] = useState("")
  const [countdown, setCountdown] = useState(0)
  const otpInputRef = useRef<HTMLInputElement>(null)

  const passwordForm = useForm<z.infer<typeof passwordLoginSchema>>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: { email: "", password: "" },
  })

  const otpEmailForm = useForm<z.infer<typeof otpEmailSchema>>({
    resolver: zodResolver(otpEmailSchema),
    defaultValues: { email: "" },
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  })

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => (prev <= 1 ? 0 : prev - 1)), 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  useEffect(() => {
    if (mode === "otp" && otpStep === "verify" && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [mode, otpStep])

  const finishLogin = () => {
    setIsSuccess(true)
    if (onSuccess) onSuccess()
    else router.push("/")
  }

  const onPasswordSubmit = async (data: z.infer<typeof passwordLoginSchema>) => {
    try {
      setIsLoading(true)
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })
      if (error) {
        toast.error("登录失败", { description: error.message || "邮箱或密码错误" })
        return
      }
      finishLogin()
    } catch (error) {
      console.error("邮箱密码登录失败:", error)
      toast.error("登录失败", { description: "请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  const sendOtp = async (email: string) => {
    const trimmedEmail = email.trim().toLowerCase()
    try {
      setIsLoading(true)
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: trimmedEmail,
        type: "sign-in",
      })
      if (error) {
        toast.error("发送失败", { description: error.message || "无法发送验证码，请稍后重试" })
        return
      }
      setOtpEmail(trimmedEmail)
      setOtpStep("verify")
      setCountdown(60)
      toast.success("验证码已发送", { description: "请查收您的邮箱" })
    } catch (error) {
      console.error("发送验证码失败:", error)
      toast.error("发送失败", { description: "无法发送验证码，请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  const onOtpEmailSubmit = async (data: z.infer<typeof otpEmailSchema>) => {
    await sendOtp(data.email)
  }

  const onOtpSubmit = async (data: z.infer<typeof otpSchema>) => {
    try {
      setIsLoading(true)
      const { error } = await authClient.signIn.emailOtp({
        email: otpEmail,
        otp: data.otp,
      })
      if (error) {
        toast.error("验证失败", { description: error.message || "验证码错误或已过期" })
        return
      }
      finishLogin()
    } catch (error) {
      console.error("验证码登录失败:", error)
      toast.error("登录失败", { description: "请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>登录成功，正在跳转...</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {mode === "password" ? (
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱地址</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" autoComplete="email" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入密码" type="password" autoComplete="current-password" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中
                </>
              ) : (
                "登录"
              )}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={() => {
                  setMode("otp")
                  setOtpStep("request")
                  otpForm.reset({ otp: "" })
                  const currentEmail = passwordForm.getValues("email")
                  if (currentEmail) otpEmailForm.setValue("email", currentEmail)
                }}
              >
                忘记密码 / 使用验证码登录
              </Button>
            </div>
          </form>
        </Form>
      ) : otpStep === "request" ? (
        <Form {...otpEmailForm}>
          <form onSubmit={otpEmailForm.handleSubmit(onOtpEmailSubmit)} className="space-y-4">
            <FormField
              control={otpEmailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱地址</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" autoComplete="email" {...field} className="h-11" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发送中
                </>
              ) : (
                "发送验证码"
              )}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setMode("password")}>
                使用密码登录
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
            <div className="text-sm text-muted-foreground">
              验证码已发送至 <span className="font-medium">{otpEmail}</span>
            </div>
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>验证码</FormLabel>
                  <FormControl>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} {...field} ref={otpInputRef}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  验证中
                </>
              ) : (
                "验证并登录"
              )}
            </Button>
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                className="p-0 h-auto"
                onClick={() => {
                  setOtpStep("request")
                  otpForm.reset({ otp: "" })
                }}
              >
                更换邮箱
              </Button>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => sendOtp(otpEmail)}
                disabled={countdown > 0 || isLoading}
              >
                {countdown > 0 ? `重新发送(${countdown}s)` : "重新发送"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

