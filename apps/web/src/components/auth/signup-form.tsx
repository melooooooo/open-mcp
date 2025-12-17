"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert"
import { Button } from "@repo/ui/components/ui/button"
import { CardDescription } from "@repo/ui/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/ui/components/ui/input-otp"
import { Loader2, CheckCircle2, Send } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

const signupSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(8, "密码至少 8 位"),
  confirmPassword: z.string().min(8, "密码至少 8 位"),
  otp: z.string().length(6, "验证码必须是6位数字"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/"
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
  })

  // 恢复倒计时逻辑
  useEffect(() => {
    const lastEmail = localStorage.getItem("otp_last_email")
    const savedEndTime = localStorage.getItem(`otp_deadline_${lastEmail}`)

    if (lastEmail && savedEndTime) {
      const now = Date.now()
      const end = parseInt(savedEndTime, 10)
      const remaining = Math.max(0, Math.ceil((end - now) / 1000))
      if (remaining > 0) {
        setCountdown(remaining)
      }
    }
  }, [])

  // 倒计时计时器
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  // 注册成功后自动跳转（并提供可控清理，避免 setTimeout 丢失）
  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(() => {
      router.replace(redirectTo)
      router.refresh()
    }, 800)
    return () => clearTimeout(timer)
  }, [isSuccess, redirectTo, router])

  const startCountdown = (targetEmail: string) => {
    const seconds = 60
    setCountdown(seconds)
    const endTime = Date.now() + seconds * 1000
    localStorage.setItem("otp_last_email", targetEmail)
    localStorage.setItem(`otp_deadline_${targetEmail}`, endTime.toString())
  }

  const handleSendOtp = async () => {
    // 仅校验 Email 和 Password
    const isEmailValid = await form.trigger("email")
    const isPasswordValid = await form.trigger("password")

    if (!isEmailValid || !isPasswordValid) return

    const values = form.getValues()

    try {
      setIsSendingOtp(true)
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email, password: values.password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "发送失败")
      }

      startCountdown(values.email)
      toast.success("验证码已发送", { description: "请查收邮件" })
    } catch (error) {
      console.error("发送验证码失败", error)
      toast.error("发送验证码失败", {
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleRegister = async (values: z.infer<typeof signupSchema>) => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/auth/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          code: values.otp
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "注册失败")
      }

      setIsSuccess(true)
      toast.success("注册成功", { description: "正在为您登录" })
    } catch (error) {
      console.error("注册失败", error)
      toast.error("注册失败", {
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>注册成功，正在登录...</AlertDescription>
        </Alert>
        <Button variant="outline" className="w-full" onClick={() => router.replace(redirectTo)}>
          立即跳转
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
        <CardDescription className="text-center text-sm text-muted-foreground pb-2">
          创建一个新账户，开启您的旅程
        </CardDescription>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邮箱地址</FormLabel>
              <FormControl>
                <Input type="email" placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>设置密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="至少 8 位" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="再次输入密码" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>验证码</FormLabel>
          <div className="flex gap-2 items-start">
            <FormField
              control={form.control}
              name="otp"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              className="w-32 shrink-0"
              disabled={countdown > 0 || isSendingOtp}
              onClick={handleSendOtp}
            >
              {isSendingOtp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : countdown > 0 ? (
                `${countdown}s 后重试`
              ) : (
                <>
                  获取验证码
                  <Send className="ml-2 h-3 w-3" />
                </>
              )}
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              注册中
            </>
          ) : (
            "立即注册"
          )}
        </Button>
      </form>
    </Form>
  )
}
