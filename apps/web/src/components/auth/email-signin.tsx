
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert"
import { Button } from "@repo/ui/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/ui/components/ui/input-otp"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { authClient } from "@/lib/auth-client"

const emailSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
})

const passwordSchema = z.object({
  password: z.string().min(1, "请输入密码"),
})

const otpSchema = z.object({
  otp: z.string().length(6, "验证码必须是6位数字"),
})

interface EmailLoginProps {
  onSuccess?: () => void
}

export function EmailLogin({ onSuccess }: EmailLoginProps) {
  const [step, setStep] = useState<"email" | "password" | "otp" | "success">("email")
  const [isLoading, setIsLoading] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const otpInputRef = useRef<HTMLInputElement>(null)

  // 用于切换回邮箱时保留输入
  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  })

  useEffect(() => {
    if (step === "otp" && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [step])

  // 倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  const startCountdown = () => {
    setCountdown(60)
  }

  // 第一步：检查邮箱
  const onEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
    try {
      setIsLoading(true)
      // 调用后端检查邮箱是否存在
      const apiUrl = "/api/user/check-email";
      console.log(`Checking email at ${apiUrl} with data:`, { email: data.email });

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      })

      console.log(`Check response status: ${res.status}`);
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || "检查失败")

      setEmailAddress(data.email)

      if (result.exists) {
        // 用户存在 -> 输入密码
        setStep("password")
      } else {
        // 用户不存在 -> 提示用户去注册
        toast.info("账户不存在", {
          description: "该邮箱尚未注册，正在跳转至注册页面...",
        })
        setTimeout(() => {
          router.push(`/auth/sign-up?email=${encodeURIComponent(data.email)}`)
        }, 1500)
      }
    } catch (error) {
      console.error("邮箱检查失败:", error)
      toast.error("系统错误", { description: "无法验证邮箱，请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  // 第二步：密码登录
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setIsLoading(true)
      const { error } = await authClient.signIn.email({
        email: emailAddress,
        password: data.password,
      })
      if (error) {
        toast.error("登录失败", {
          description: error?.message || "密码错误，请重试",
        })
        return
      }
      setStep("success")
      if (onSuccess) onSuccess()
      else router.push("/")
    } catch (error) {
      console.error("密码登录失败:", error)
      toast.error("登录失败", { description: "请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  // 分支：切换到验证码登录 (忘记密码或首选OTP)
  const switchToOTP = async () => {
    try {
      setIsLoading(true)
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: emailAddress,
        type: "sign-in",
      })
      if (error) throw error
      setStep("otp")
      startCountdown()
      toast.success("验证码已发送", { description: "请查收您的邮箱" })
    } catch (error) {
      console.error("发送验证码失败:", error)
      toast.error("发送失败", { description: "无法发送验证码，请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = async () => {
    try {
      setIsLoading(true)
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: emailAddress,
        type: "sign-in",
      })
      if (error) throw error
      startCountdown()
      toast.success("验证码已重新发送")
    } catch (error) {
      toast.error("发送失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 第三步：OTP 登录
  const onOTPSubmit = async (data: z.infer<typeof otpSchema>) => {
    try {
      setIsLoading(true)
      const { error } = await authClient.signIn.emailOtp({
        email: emailAddress,
        otp: data.otp,
      })
      if (error) {
        toast.error("验证失败", { description: "验证码错误或已过期" })
      } else {
        setStep("success")
        if (onSuccess) onSuccess()
        else router.push("/")
      }
    } catch (error) {
      console.error("OTP登录失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "success") {
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
      {step === "email" && (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱地址</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" {...field} className="h-11" />
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
                <>
                  继续
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      )}

      {step === "password" && (
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">当前账号: <span className="font-medium text-foreground">{emailAddress}</span></div>
              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setStep("email")}>更换</Button>
            </div>
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>输入密码</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入您的密码" type="password" autoComplete="current-password" {...field} className="h-11" />
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
              <Button type="button" variant="link" className="text-sm" onClick={switchToOTP}>
                忘记密码 / 使用验证码登录
              </Button>
            </div>
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={() => setStep("email")} className="text-muted-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> 返回上一步
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === "otp" && (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              验证码已发送至 <span className="font-medium">{emailAddress}</span>
            </div>
            <FormField
              control={otpForm.control}
              name="otp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>输入验证码</FormLabel>
                  <div className="flex justify-center my-4">
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "验证并登录"}
            </Button>
            <div className="flex justify-between items-center mt-2">
              <Button type="button" variant="ghost" className="p-0 h-auto" onClick={() => setStep("password")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 返回密码登录
              </Button>
              <Button type="button" variant="link" onClick={resendOTP} disabled={countdown > 0 || isLoading}>
                {countdown > 0 ? `重新发送(${countdown}s)` : "重新发送"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
