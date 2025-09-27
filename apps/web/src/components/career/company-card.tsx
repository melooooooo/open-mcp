"use client"

import { Building2, MapPin, Users, TrendingUp, Briefcase, Star, ChevronRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Progress } from "@repo/ui/components/ui/progress"
import { cn } from "@repo/ui/lib/utils"

interface CompanyCardProps {
  company: {
    id: string
    name: string
    logo?: string
    description?: string
    industry?: string
    size?: string
    fundingStage?: string
    locations?: string[]
    website?: string
    benefits?: string[]
    cultureScore?: number
    jobCount?: number
    averageSalary?: string
    growthRate?: number
    tags?: string[]
    isHiring?: boolean
    isPopular?: boolean
  }
  variant?: "default" | "compact" | "detailed"
  className?: string
  onClick?: () => void
}

const sizeMap = {
  "0-50": { label: "初创", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  "50-150": { label: "成长期", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  "150-500": { label: "C轮+", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "500-2000": { label: "独角兽", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  "2000+": { label: "大厂", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
}

const industryIcons: Record<string, string> = {
  "互联网": "💻",
  "金融": "💰",
  "教育": "📚",
  "医疗": "🏥",
  "电商": "🛒",
  "游戏": "🎮",
  "人工智能": "🤖",
  "新能源": "⚡",
}

export function CompanyCard({ company, variant = "default", className, onClick }: CompanyCardProps) {
  const getCultureScoreColor = (score?: number) => {
    if (!score) return ""
    if (score >= 4.5) return "text-green-600 dark:text-green-400"
    if (score >= 4) return "text-blue-600 dark:text-blue-400"
    if (score >= 3.5) return "text-yellow-600 dark:text-yellow-400"
    return "text-gray-600 dark:text-gray-400"
  }

  if (variant === "compact") {
    return (
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={company.logo} alt={company.name} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                {company.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {company.name}
                </h3>
                {company.isHiring && (
                  <Badge className="bg-green-500 text-white text-xs h-4">
                    在招
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {company.industry && <span>{company.industry}</span>}
                {company.size && sizeMap[company.size] && (
                  <Badge variant="secondary" className="text-xs h-4">
                    {sizeMap[company.size].label}
                  </Badge>
                )}
                {company.jobCount !== undefined && (
                  <span>{company.jobCount} 个职位</span>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-xl relative overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      {/* 热门标签 */}
      {company.isPopular && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-bl-lg">
            🔥 热门
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 ring-4 ring-gray-100 dark:ring-gray-800">
            <AvatarImage src={company.logo} alt={company.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
              {company.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {company.name}
                  {company.isHiring && (
                    <Badge className="bg-green-500 text-white text-xs">
                      正在招聘
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  {company.industry && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <span>{industryIcons[company.industry] || "🏢"}</span>
                      {company.industry}
                    </span>
                  )}
                  {company.size && sizeMap[company.size] && (
                    <Badge className={cn("text-xs", sizeMap[company.size].color)}>
                      {sizeMap[company.size].label}
                    </Badge>
                  )}
                  {company.fundingStage && (
                    <Badge variant="outline" className="text-xs">
                      {company.fundingStage}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* 公司评分 */}
            {company.cultureScore && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className={cn("text-sm font-medium", getCultureScoreColor(company.cultureScore))}>
                    {company.cultureScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">企业文化评分</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 公司描述 */}
        {company.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {company.description}
          </p>
        )}

        {/* 关键数据 */}
        <div className="grid grid-cols-3 gap-3">
          {company.jobCount !== undefined && (
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                <Briefcase className="h-4 w-4" />
                <span className="text-lg font-bold">{company.jobCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">在招职位</p>
            </div>
          )}
          {company.averageSalary && (
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="text-orange-600 dark:text-orange-400">
                <span className="text-lg font-bold">{company.averageSalary}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">平均薪资</p>
            </div>
          )}
          {company.growthRate !== undefined && (
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                <TrendingUp className="h-4 w-4" />
                <span className="text-lg font-bold">{company.growthRate}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">增长率</p>
            </div>
          )}
        </div>

        {/* 地点 */}
        {company.locations && company.locations.length > 0 && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1">
              {company.locations.map((location, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 福利标签 */}
        {company.benefits && company.benefits.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {company.benefits.slice(0, 5).map((benefit, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {benefit}
              </Badge>
            ))}
            {company.benefits.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{company.benefits.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* 公司标签 */}
        {company.tags && company.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {company.tags.map((tag, index) => (
              <span key={index} className="text-xs text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      {variant === "detailed" && (
        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {company.size || "规模未知"}
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              查看详情
            </Badge>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}