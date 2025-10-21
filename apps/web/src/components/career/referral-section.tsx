"use client"

import { ArrowRight, Zap } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { ReferralCard } from "./referral-card"
import Link from "next/link"

interface ReferralSectionProps {
  title?: string
  description?: string
  referrals: any[]
  showViewAll?: boolean
}

export function ReferralSection({ 
  title = "内推机会", 
  description = "来自大厂在职员工的真实内推，提高简历通过率",
  referrals, 
  showViewAll = true 
}: ReferralSectionProps) {
  return (
    <section className="py-12 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
      <div className="container">
        {/* 标题区域 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h2>
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                <Zap className="mr-1 h-3 w-3" />
                快速通道
              </Badge>
            </div>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
          {showViewAll && (
            <Button variant="ghost" asChild>
              <Link href="/referrals">
                查看全部
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* 内推卡片网格 */}
        {referrals.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {referrals.map((referral) => (
              <ReferralCard
                key={referral.id}
                referral={referral}
                onApply={() => console.log(`Apply for referral ${referral.id}`)}
                onClick={() => console.log(`Navigate to referral ${referral.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-background/60 p-8 text-center text-sm text-muted-foreground">
            当前暂无开放的内推机会，关注职位广场或先完善个人资料，系统会在有新名额时第一时间通知你。
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-8 rounded-lg bg-orange-100 dark:bg-orange-950/30 p-4 text-center">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            💡 内推名额有限，建议尽早申请。成功获得内推后，请认真准备简历和面试。
          </p>
        </div>
      </div>
    </section>
  )
}
