"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/ui/components/ui/input-otp"
import { ArrowRight,Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect,useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { authClient } from "@/lib/auth-client"


const phoneSchema = z.object({
  phone: z.string().min(11, "请输入有效的手机号").max(11, "请输入有效的手机号"),
})

const verificationSchema = z.object({
  code: z.string().length(6, "验证码必须是6位数字"),
})

interface PhoneSigninProps {
  onSuccess?: () => void
}

export function PhoneSignin({ onSuccess }: PhoneSigninProps) {
  const [step, setStep] = useState<"phone" | "verification">("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter();
  const otpInputRef = useRef<HTMLInputElement>(null)

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  })

  const verificationForm = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  })

  useEffect(() => {
    if (step === "verification" && otpInputRef.current) {
      otpInputRef.current.focus()
    }
  }, [step])

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const onPhoneSubmit = async (data: z.infer<typeof phoneSchema>) => {
    try {
      setIsLoading(true)
      const { data: result, error } = await authClient.phoneNumber.sendOtp({
        phoneNumber: data.phone
      });
      console.warn("[phone-signin] [onPhoneSubmit] result", result, error)
      if (error && error?.code !== "SUCCESS") {
        toast.error("发送验证码失败", { description: error?.message })
      } else {
        toast.success("验证码发送成功", { description: "请在手机上查看验证码" })
        setPhoneNumber(data.phone)
        setStep("verification")
        startCountdown()
      }
    } catch (error) {
      console.error("发送验证码失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const onVerificationSubmit = async (data: z.infer<typeof verificationSchema>) => {
    try {
      setIsLoading(true)
      const { data: result, error } = await authClient.phoneNumber.verify({
        phoneNumber: phoneNumber,
        code: data.code
      });
      console.warn("[phone-signin] [onVerificationSubmit] result", result, error)
      if (error && error?.code !== "SUCCESS") {
        toast.error("验证失败", { description: error?.message })
      } else {
        toast.success("验证成功");
        // 验证成功，可以跳转到首页或其他页面
        console.log("验证成功");
        if (onSuccess) {
          onSuccess?.()
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("验证码验证失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    try {
      setIsLoading(true)
      await authClient.phoneNumber.sendOtp({
        phoneNumber
      })
      verificationForm.reset({ code: "" })
      startCountdown()
      if (otpInputRef.current) {
        otpInputRef.current.focus()
      }
    } catch (error) {
      console.error("重新发送验证码失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <Form {...(phoneForm as any)}>
          <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
            <FormField
              control={phoneForm.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入手机号" {...field} className="h-11" maxLength={11} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发送验证码
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
      ) : (
        <Form {...(verificationForm as any)}>
          <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              验证码已发送至 <span className="font-medium">{phoneNumber}</span>
            </div>
            <FormField
              control={verificationForm.control as any}
              name="code"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel>验证码</FormLabel>
                  <FormControl>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        {...field}
                        value={field.value || ""}
                        onChange={(value) => {
                          field.onChange(value)
                          if (value.length === 6) {
                            verificationForm.handleSubmit(onVerificationSubmit)()
                          }
                        }}
                        ref={otpInputRef}
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
                "登录"
              )}
            </Button>
            <div className="flex justify-between items-center mt-2">
              <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setStep("phone")}>
                更换手机号
              </Button>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={resendCode}
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
