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
    <footer className="w-full border-t border-slate-800 py-12 bg-slate-900 text-slate-400">
      <Container>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <LogoIcon type="openmcp" className="text-white" />
              <span className="font-bold text-slate-100 text-lg">银行帮</span>
            </div>
            <p className="text-sm leading-relaxed">
              银行帮专注服务银行求职者，整合各大银行招聘信息、面经与薪酬情报，帮助你自信踏出职场第一步。
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-slate-100">求职导航</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/jobs" className="hover:text-blue-400 transition-colors">
                  职位广场
                </Link>
              </li>
              <li>
                <Link href="/experiences" className="hover:text-blue-400 transition-colors">
                  面经与攻略
                </Link>
              </li>
              {/* TODO: 公司页面暂未完善，暂时隐藏 */}
              {/* <li>
                <Link href="/companies" className="hover:text-blue-400 transition-colors">
                  企业库
                </Link>
              </li> */}
              {/* TODO: 薪酬页面暂未完善，暂时隐藏 */}
              {/* <li>
                <Link href="/salary" className="hover:text-blue-400 transition-colors">
                  薪酬洞察
                </Link>
              </li> */}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-slate-100">服务支持</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/help" className="hover:text-blue-400 transition-colors">
                  帮助中心
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/about/terms" className="hover:text-blue-400 transition-colors">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/about/service" className="hover:text-blue-400 transition-colors">
                  服务条款
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setIsContactDialogOpen(true)}
                  className="hover:text-blue-400 transition-colors w-full text-left"
                >
                  企业合作
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-slate-100">订阅求职情报</h3>
            <p className="text-sm">获取最新职位投递窗口、面试经验和校招攻略，领先一步拿到 Offer。</p>
            <EmailSubscribe />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-slate-500">Copyright ©2025-2027 银行帮版权所有</p>
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Link href="https://beian.miit.gov.cn/" target="_blank" className="hover:text-slate-400 transition-colors">
                津ICP备2023007973号-1
              </Link>
              <span className="text-slate-700">|</span>
              <Link href="http://www.beian.gov.cn/portal/registerSystemInfo" target="_blank" className="hover:text-slate-400 transition-colors flex items-center gap-1">
                <span className="rounded-full opacity-80">
                  <Image src="/images/gongan.png" alt="津公网安备12011402001495号" className="w-3 h-auto grayscale opacity-70" width={16} height={16} />
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
