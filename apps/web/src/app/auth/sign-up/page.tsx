import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { SignupForm } from "@/components/auth/signup-form"

export const metadata = {
  title: "邮箱注册 - 银行帮",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 py-8">
      <Card className="w-full max-w-md border-none shadow-lg">
        <CardHeader className="space-y-2 pb-2 text-center">
          <CardTitle className="text-2xl font-bold">注册银行帮</CardTitle>
          <CardDescription>使用邮箱注册，设置密码并完成验证码验证</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </div>
  )
}
