"use client"

import Link from "next/link"
import { useState } from "react"

import { EmailSubscribe } from "@/components/email-subscribe"
import { Container } from "@/components/web/container"
import { LogoIcon } from "@/components/web/logo-icon"
import { WechatQRCodeDialog } from "@/components/wechat-qrcode-dialog"
import Image from "next/image"

export function Footer() {
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)

  return (
    <footer className="w-full border-t py-10 bg-muted/20">
      <Container>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LogoIcon type="openmcp" />
              <span className="font-bold">职启航</span>
            </div>
            <p className="text-sm text-muted-foreground">
              职启航专注服务秋招应届生与在校生，整合职位、内推、面经与薪酬情报，帮助你自信踏出职场第一步。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">求职导航</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
                  职位广场
                </Link>
              </li>
              <li>
                <Link href="/referrals" className="text-muted-foreground hover:text-foreground transition-colors">
                  内推机会
                </Link>
              </li>
              <li>
                <Link href="/experiences" className="text-muted-foreground hover:text-foreground transition-colors">
                  面经与攻略
                </Link>
              </li>
              <li>
                <Link href="/companies" className="text-muted-foreground hover:text-foreground transition-colors">
                  企业库
                </Link>
              </li>
              <li>
                <Link href="/salary" className="text-muted-foreground hover:text-foreground transition-colors">
                  薪酬洞察
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">服务支持</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  帮助中心
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/about/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/about/service" className="text-muted-foreground hover:text-foreground transition-colors">
                  服务条款
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setIsContactDialogOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                >
                  企业合作
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">订阅求职情报</h3>
            <p className="text-sm text-muted-foreground">获取最新职位投递窗口、内推开放提醒和校招攻略，领先一步拿到 Offer。</p>
            <EmailSubscribe />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-muted-foreground">Copyright ©2025-2027 天津聚链科技有限公司版权所有</p>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Link href="https://beian.miit.gov.cn/" target="_blank" className="hover:underline">
                津ICP备2023007973号-1
              </Link>{" "}
              |{" "}
              <Link href="http://www.beian.gov.cn/portal/registerSystemInfo" target="_blank" className="hover:underline flex items-center gap-1">
                <span className="rounded-full pr-1">
                  <Image src="/images/gongan.png" alt="津公网安备12011402001495号" className="w-3 h-auto" width={16} height={16} />
                </span>
                津公网安备12011402001495号
              </Link>
            </div>
          </div>
        </div>
      </Container>

      <WechatQRCodeDialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen} />
    </footer>
  )
}
