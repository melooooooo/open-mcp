import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Input } from "@repo/ui/components/ui/input"
import Link from "next/link"
import { Container } from "@/components/web/container"
import { Sparkles } from "lucide-react"

export default function ShareExperiencePage() {
  return (
    <main className="bg-background py-16">
      <Container className="max-w-3xl space-y-10">
        <header className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">分享面试经验，帮助更多同学</h1>
          <p className="text-muted-foreground">
            登录后即可提交你的面经、求职攻略或岗位点评。我们会在 24 小时内完成初审并同步到经验库。
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>登录后继续</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              立即登录或注册职启航账号，系统会自动为你的分享生成草稿，你可随时补充完善再发布。
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/auth/sign-in?next=/experiences/share/form">已有账号登录</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/auth/register?next=/experiences/share/form">注册新账号</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>分享内容要点</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>为了加快审核，请提前梳理以下信息：</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>公司与岗位、面试轮次、时间节点</li>
              <li>每一轮的题目重点与你的解题思路</li>
              <li>简历亮点或面试官关注的问题</li>
              <li>薪资、福利、团队氛围等候选人关心的信息</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>想先写个草稿？</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>登录后这里会显示可保存的草稿表单，便于你分段撰写并随时继续。</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="公司 / 团队" disabled />
              <Input placeholder="岗位名称" disabled />
              <Input placeholder="面试轮次" disabled />
              <Input placeholder="面试时间" disabled />
            </div>
            <Textarea rows={6} placeholder="详细描述你的面试体验..." disabled />
            <Button disabled>登录后开启草稿模式</Button>
          </CardContent>
        </Card>
      </Container>
    </main>
  )
}
