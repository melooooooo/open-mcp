"use client"

import { Building2, MapPin, DollarSign, Calendar, Users, Bookmark } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { cn } from "@repo/ui/lib/utils"

interface JobCardProps {
  job: {
    id: string
    title: string
    company: {
      name: string
      logo?: string
      size?: string
    }
    department?: string
    location: string[]
    salaryMin?: number
    salaryMax?: number
    jobType: "fulltime" | "intern" | "parttime"
    educationRequirement?: string
    tags?: string[]
    applicationDeadline?: string
    viewCount?: number
    applicationCount?: number
    isHot?: boolean
    isNew?: boolean
    websiteUrl?: string
  }
  variant?: "default" | "compact" | "detailed"
  className?: string
  onBookmark?: () => void
  onClick?: () => void
}

const jobTypeMap = {
  fulltime: { label: "全职", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  intern: { label: "实习", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  parttime: { label: "兼职", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
}

const companySizeMap = {
  "0-50": "初创",
  "50-150": "成长期",
  "150-500": "C轮+",
  "500-2000": "独角兽",
  "2000+": "大厂",
}

export function JobCard({ job, variant = "default", className, onBookmark, onClick }: JobCardProps) {
  const companyName = job.company?.name ?? "未知公司"
  const companySizeKey = job.company?.size as keyof typeof companySizeMap | undefined
  const jobTypeMeta = jobTypeMap[job.jobType] ?? {
    label: "职位",
    color: "bg-muted text-muted-foreground",
  }
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "薪资面议"
    if (!max) return `${min}k起`
    if (min === max) return `${min}k`
    return `${min}-${max}k`
  }

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return "已截止"
    if (days === 0) return "今日截止"
    if (days <= 3) return `剩${days}天`
    return null
  }

  const daysLeft = getDaysLeft(job.applicationDeadline)

  if (variant === "compact") {
    return (
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-lg card-hover",
          className
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={job.company?.logo} alt={companyName} />
              <AvatarFallback className="text-xs">
                {companyName.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {job.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{companyName}</p>
                </div>
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400 shrink-0">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.location?.[0] ?? "城市不限"}
                </span>
                {job.educationRequirement && (
                  <span>{job.educationRequirement}</span>
                )}
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
        "group cursor-pointer transition-all duration-200 hover:shadow-xl card-hover relative overflow-hidden",
        className
      )}
      onClick={onClick}
    >
      {/* 热门/新发布标签 */}
      {(job.isHot || job.isNew) && (
        <div className="absolute top-0 right-0 z-10">
          {job.isHot && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-bl-lg">
              🔥 热门
            </div>
          )}
          {job.isNew && !job.isHot && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1 rounded-bl-lg">
              ✨ 新发布
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0 ring-2 ring-gray-100 dark:ring-gray-800">
            <AvatarImage src={job.company?.logo} alt={companyName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {companyName.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {job.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium text-muted-foreground">{companyName}</p>
                  {companySizeKey && (
                    <>
                      <span className="text-muted-foreground">·</span>
                      <Badge variant="secondary" className="text-xs">
                        {companySizeMap[companySizeKey] || job.company?.size}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onBookmark?.()
                }}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 薪资和工作类型 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-500" />
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </span>
            {job.salaryMin && job.salaryMax && (
              <span className="text-xs text-muted-foreground">·月薪</span>
            )}
          </div>
          <Badge className={cn("text-xs", jobTypeMeta.color)}>
            {jobTypeMeta.label}
          </Badge>
        </div>

        {/* 基本信息 */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location.join("、")}
          </span>
          {job.educationRequirement && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {job.educationRequirement}
            </span>
          )}
          {job.department && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {job.department}
            </span>
          )}
        </div>

        {/* 标签 */}
        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.tags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {job.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{job.tags.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {job.viewCount !== undefined && (
              <span>{job.viewCount} 浏览</span>
            )}
            {job.applicationCount !== undefined && (
              <span>{job.applicationCount} 已投递</span>
            )}
          </div>
          {daysLeft && (
            <Badge 
              variant={daysLeft.includes("剩") && parseInt(daysLeft) <= 3 ? "destructive" : "secondary"}
              className="text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              {daysLeft}
            </Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
