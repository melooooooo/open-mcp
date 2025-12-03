"use client"

import { Container } from "@/components/web/container"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@repo/ui/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { WechatQRCodeDialog } from "@/components/wechat-qrcode-dialog"

const faqs = [
  {
    question: "为什么我看不到实时职位？",
    answer:
      "目前演示环境未连接企业数据库，你可以先浏览示例职位与流程。开通企业合作后，我们会同步真实职位信息并提供订阅提醒。",
  },
  {
    question: "如何提交新的职位网站？",
    answer:
      "目前职位合集由运营团队维护，如需新增渠道，可在页面底部提交反馈或联系企业微信，我们会在 1-2 个工作日内审核上线。",
  },
  {
    question: "经验分享是否需要审核？",
    answer:
      "所有经验将在 24 小时内完成初审，确保内容真实、无敏感信息。必要时会与作者沟通补充细节。",
  },
  {
    question: "积分可以做什么？",
    answer:
      "通过分享面经、完善企业信息、举报失效链接等行为可获得积分，后续可兑换简历诊断、模拟面试等增值服务。",
  },
]

export default function HelpPage() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)

  return (
    <main className="bg-background pb-16">
      <section className="border-b bg-muted/20">
        <Container className="py-12 sm:py-16 space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">帮助中心</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            常见问题、使用指引与服务说明都在这里。如果你需要人工支持，欢迎通过右下角的企业微信与我们联系。
          </p>
        </Container>
      </section>

      <section className="py-12">
        <Container className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>常见问题</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`item-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>新手指南</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>注册完成后，建议先完成以下步骤：</p>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>完善个人资料与求职意向；</li>
                  <li>上传简历并开启一键投递；</li>
                  <li>关注心仪公司或订阅职位提醒；</li>
                  <li>阅读相关面经，确认准备方向。</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>联系客服</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>在银行帮企业微信中，我们会提供 1v1 答疑与活动通知。</p>
                <Button variant="outline" asChild>
                  <button onClick={() => setIsContactDialogOpen(true)} className="w-full">
                    打开企业微信二维码
                  </button>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      <WechatQRCodeDialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen} />
    </main>
  )
}
