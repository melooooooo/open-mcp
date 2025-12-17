"use client"

import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Label } from "@repo/ui/components/ui/label"
import { Switch } from "@repo/ui/components/ui/switch"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

import { EmailLogin } from "@/components/auth/email-signin"
import { PhoneSignin } from "@/components/auth/phone-signin"

import { GoogleIcon } from "@/components/icons/google"
import { authClient } from "@/lib/auth-client"

export type AuthMode = "email"

interface LoginFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  isModal?: boolean
}

export function LoginForm({ onSuccess, onCancel, isModal = false }: LoginFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>("email")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/"

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(redirectTo)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
        errorCallbackURL: "/auth/error",
      })
    } catch (error) {
      console.error('Google login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto border-none shadow-lg">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-2xl font-bold text-center">欢迎回来</CardTitle>
        <CardDescription className="text-center">登录您的账户继续访问</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full py-6 flex items-center justify-center gap-2 text-base font-medium hover:bg-muted/50 transition-colors"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <GoogleIcon className="w-5 h-5" />
            <span>通过 Google 登录</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                或者使用邮箱
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <EmailLogin onSuccess={handleSuccess} />
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          还没有账号？
          <Button
            variant="link"
            className="p-1 h-auto align-baseline"
            onClick={() => router.push(`/auth/sign-up?redirectTo=${encodeURIComponent(redirectTo)}`)}
          >
            注册银行帮
          </Button>
        </div>

      </CardContent>
      {isModal && (
        <CardFooter>
          <Button variant="ghost" onClick={onCancel} className="w-full">
            取消
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
