"use client"

import { Star, CheckCircle, Users, Calendar, TrendingUp, MessageCircle, Award } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Progress } from "@repo/ui/components/ui/progress"
import { cn } from "@repo/ui/lib/utils"

interface ReferralCardProps {
  referral: {
    id: string
    referrer: {
      id: string
      name: string
      avatar?: string
      title: string
      company: string
      department?: string
      isVerified?: boolean
      successRate?: number
      totalReferred?: number
    }
    job: {
      title: string
      department?: string
      location: string[]
      salaryRange?: string
    }
    quotaTotal: number
    quotaUsed: number
    validUntil?: string
    requirements?: string[]
    tags?: string[]
    description?: string
    rating?: number
    reviews?: number
    createdAt?: string // 发布时间（可选）
    updatedAt?: string // 修改时间（可选）
    title?: string // 发布标题（有些数据源可能有单独标题）
  }
  variant?: "default" | "compact" | "minimal" | "list"
  className?: string
  onApply?: () => void
  onClick?: () => void
}

export function ReferralCard({ referral, variant = "list", className, onApply, onClick }: ReferralCardProps) {
  const quotaPercentage = (referral.quotaUsed / referral.quotaTotal) * 100
  const quotaRemaining = referral.quotaTotal - referral.quotaUsed
  const isQuotaFull = quotaRemaining === 0

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return "已结束"
    if (days === 0) return "今日截止"
    if (days <= 7) return `剩${days}天`
    return null
  }

  const daysLeft = getDaysLeft(referral.validUntil)

  const getSuccessRateColor = (rate?: number) => {
    if (!rate) return ""
    if (rate >= 80) return "text-green-600 dark:text-green-400"
    if (rate >= 60) return "text-blue-600 dark:text-blue-400"
    if (rate >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-gray-600 dark:text-gray-400"
  }

  // 极简样式：仅显示发布标题、发布人、发布时间
  if (variant === "minimal") {
    const title = referral.title || referral.job.title
    const publishedAt = referral.createdAt
      ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(
        new Date(referral.createdAt)
      )
      : undefined

    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-150 hover:shadow-md",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={referral.referrer.avatar} alt={referral.referrer.name} />
              <AvatarFallback className="text-[10px]">
                {referral.referrer.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{title}</h3>
                {referral.referrer.isVerified && (
                  <Badge variant="secondary" className="h-5 text-[10px]">已认证</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {referral.referrer.name}
                {publishedAt && ` · ${publishedAt}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  // 列表样式：标题、发布人、发布时间/修改时间
  if (variant === "list") {
    const title = referral.title || referral.job.title
    const formatDate = (iso?: string) =>
      iso ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : undefined

    const publishedAt = formatDate(referral.createdAt)
    const updatedAt = formatDate(referral.updatedAt)

    return (
      <Card className={cn("group cursor-pointer hover:bg-muted/40 transition-colors", className)} onClick={onClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={referral.referrer.avatar} alt={referral.referrer.name} />
              <AvatarFallback className="text-[10px]">
                {referral.referrer.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-sm truncate">{title}</h3>
                {referral.referrer.isVerified && (
                  <Badge variant="secondary" className="h-5 text-[10px]">已认证</Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="truncate">发布人：{referral.referrer.name}</span>
                {publishedAt && <span>发布时间：{publishedAt}</span>}
                {updatedAt && <span>修改时间：{updatedAt}</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }


  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg",
          isQuotaFull && "opacity-60",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0 ring-2 ring-orange-100 dark:ring-orange-900/30">
              <AvatarImage src={referral.referrer.avatar} alt={referral.referrer.name} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white text-xs">
                {referral.referrer.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{referral.job.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {referral.referrer.name} · {referral.referrer.company}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {referral.referrer.successRate && (
                  <Badge variant="secondary" className="text-xs">
                    {referral.referrer.successRate}% 成功率
                  </Badge>
                )}
                <Badge
                  variant={isQuotaFull ? "destructive" : "default"}
                  className="text-xs"
                >
                  {isQuotaFull ? "已满" : `剩余 ${quotaRemaining} 个`}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-xl relative overflow-hidden",
        isQuotaFull && "opacity-75",
        className
      )}
      onClick={onClick}
    >
      {/* 认证标识 */}
      {referral.referrer.isVerified && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            已认证
          </Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          {/* 内推人信息 */}
          <Avatar className="h-14 w-14 shrink-0 ring-4 ring-orange-100 dark:ring-orange-900/30">
            <AvatarImage src={referral.referrer.avatar} alt={referral.referrer.name} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white">
              {referral.referrer.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  {referral.referrer.name}
                  {referral.referrer.totalReferred && referral.referrer.totalReferred > 10 && (
                    <Badge variant="secondary" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      金牌内推官
                    </Badge>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {referral.referrer.title} @ {referral.referrer.company}
                  {referral.referrer.department && ` · ${referral.referrer.department}`}
                </p>
              </div>
            </div>

            {/* 成功率和评分 */}
            <div className="flex items-center gap-4 mt-2">
              {referral.referrer.successRate !== undefined && (
                <div className="flex items-center gap-1">
                  <TrendingUp className={cn("h-4 w-4", getSuccessRateColor(referral.referrer.successRate))} />
                  <span className={cn("text-sm font-medium", getSuccessRateColor(referral.referrer.successRate))}>
                    {referral.referrer.successRate}% 成功率
                  </span>
                </div>
              )}
              {referral.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{referral.rating.toFixed(1)}</span>
                  {referral.reviews && (
                    <span className="text-xs text-muted-foreground">({referral.reviews})</span>
                  )}
                </div>
              )}
              {referral.referrer.totalReferred && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  已帮助 {referral.referrer.totalReferred} 人
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 职位信息 */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <h4 className="font-semibold text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {referral.job.title}
          </h4>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
            {referral.job.department && <span>{referral.job.department}</span>}
            <span>{referral.job.location.join("、")}</span>
            {referral.job.salaryRange && <span className="font-medium text-orange-600 dark:text-orange-400">{referral.job.salaryRange}</span>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 内推描述 */}
        {referral.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {referral.description}
          </p>
        )}

        {/* 要求标签 */}
        {referral.requirements && referral.requirements.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">基本要求：</p>
            <div className="flex flex-wrap gap-1.5">
              {referral.requirements.slice(0, 4).map((req, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {req}
                </Badge>
              ))}
              {referral.requirements.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{referral.requirements.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* 名额进度 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">内推名额</span>
            <span className={cn(
              "font-medium",
              isQuotaFull ? "text-red-600 dark:text-red-400" : quotaPercentage > 70 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"
            )}>
              {referral.quotaUsed}/{referral.quotaTotal} 已使用
            </span>
          </div>
          <Progress
            value={quotaPercentage}
            className="h-2"
          />
          {!isQuotaFull && quotaRemaining <= 3 && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
              ⚡ 仅剩 {quotaRemaining} 个名额，抓紧申请！
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {daysLeft && (
              <Badge
                variant={daysLeft.includes("剩") || daysLeft.includes("今日") ? "destructive" : "secondary"}
                className="text-xs"
              >
                <Calendar className="h-3 w-3 mr-1" />
                {daysLeft}
              </Badge>
            )}
            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>咨询</span>
            </button>
          </div>
          <Button
            size="sm"
            disabled={isQuotaFull}
            onClick={(e) => {
              e.stopPropagation()
              onApply?.()
            }}
            className={cn(
              !isQuotaFull && "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
            )}
          >
            {isQuotaFull ? "名额已满" : "申请内推"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}