"use client"

import { Star, Eye, ThumbsUp, MessageSquare, BookOpen, FileText, Briefcase, Clock } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { cn } from "@repo/ui/lib/utils"

interface ExperienceCardProps {
  experience: {
    id: string
    title: string
    author: {
      id: string
      name: string
      avatar?: string
      university?: string
      graduationYear?: number
      isVerified?: boolean
    }
    type: "interview" | "guide" | "review"
    company?: {
      name: string
      logo?: string
    }
    jobTitle?: string
    content?: string
    tags?: string[]
    difficulty?: 1 | 2 | 3 | 4 | 5
    readTime?: number // 阅读时长（分钟）
    viewCount?: number
    likeCount?: number
    commentCount?: number
    createdAt: string
    isPinned?: boolean
    isHot?: boolean
  }
  variant?: "default" | "compact" | "detailed" | "list"
  className?: string
  onClick?: () => void
  onLike?: () => void
}

const typeConfig = {
  interview: {
    label: "面经",
    icon: Briefcase,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  guide: {
    label: "攻略",
    icon: BookOpen,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  review: {
    label: "点评",
    icon: FileText,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
}

const DifficultyStars = ({ level }: { level: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= level
              ? level <= 2
                ? "fill-green-500 text-green-500"
                : level <= 3
                  ? "fill-yellow-500 text-yellow-500"
                  : level <= 4
                    ? "fill-orange-500 text-orange-500"
                    : "fill-red-500 text-red-500"
              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
          )}
        />
      ))}
    </div>
  )
}

export function ExperienceCard({ experience, variant = "default", className, onClick, onLike }: ExperienceCardProps) {
  const TypeIcon = typeConfig[experience.type].icon

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "今天"
    if (diffDays === 1) return "昨天"
    if (diffDays < 7) return `${diffDays}天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`
    return `${Math.floor(diffDays / 365)}年前`
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
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1">
                {experience.title}
              </h3>
              {experience.difficulty && <DifficultyStars level={experience.difficulty} />}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs h-5", typeConfig[experience.type].color)}>
                  {typeConfig[experience.type].label}
                </Badge>
                {experience.company && <span>{experience.company.name}</span>}
              </div>
              <span>{formatDate(experience.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {experience.viewCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {experience.viewCount}
                </span>
              )}
              {experience.likeCount !== undefined && (
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  {experience.likeCount}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 列表样式：标题、作者、发布时间/公司
  if (variant === "list") {
    const TypeIcon = typeConfig[experience.type].icon
    return (
      <Card className={cn("group cursor-pointer hover:bg-muted/50 transition-all duration-300 border-0 bg-transparent", className)} onClick={onClick}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-5">
            {/* 左侧图标区域 */}
            <div className="flex flex-col items-center gap-2 pt-1 shrink-0">
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
                typeConfig[experience.type].color
              )}>
                <TypeIcon className="w-6 h-6" />
              </div>
            </div>

            {/* 中间内容区域 */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {experience.title}
                    </h3>
                    <Badge variant="secondary" className={cn("h-5 text-[10px] px-1.5 font-medium shrink-0 opacity-80", typeConfig[experience.type].color)}>
                      {typeConfig[experience.type].label}
                    </Badge>
                    {experience.isPinned && (
                      <Badge variant="default" className="h-5 text-[10px] px-1.5 bg-purple-500 hover:bg-purple-600 border-0">
                        置顶
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5 border border-border">
                        <AvatarImage src={experience.author.avatar} />
                        <AvatarFallback className="text-[10px]">{experience.author.name.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground/80">{experience.author.name}</span>
                    </span>

                    {experience.company?.name && (
                      <>
                        <span className="text-border">|</span>
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>{experience.company.name}</span>
                        </span>
                      </>
                    )}

                    <span className="text-border">|</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(experience.createdAt)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 标签和数据 */}
              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap gap-2">
                  {experience.tags && experience.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground text-xs hover:bg-primary/5 hover:text-primary transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground/70 shrink-0">
                  {typeof experience.viewCount === "number" && (
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{experience.viewCount}</span>
                    </span>
                  )}
                  {typeof experience.likeCount === "number" && (
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{experience.likeCount}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧箭头 - 仅在大屏幕显示 */}
            <div className="hidden sm:flex items-center self-center pl-2">
              <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-muted-foreground/30 group-hover:text-primary group-hover:bg-primary/5 transition-all duration-300">
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
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
        className
      )}
      onClick={onClick}
    >
      {/* 置顶/热门标签 */}
      {(experience.isPinned || experience.isHot) && (
        <div className="absolute top-0 left-0 z-10 flex">
          {experience.isPinned && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1">
              📌 置顶
            </div>
          )}
          {experience.isHot && (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1">
              🔥 热门
            </div>
          )}
        </div>
      )}

      <CardHeader>
        <div className="space-y-3">
          {/* 标题和类型 */}
          <div className="flex items-start gap-3">
            <Badge className={cn("shrink-0", typeConfig[experience.type].color)}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {typeConfig[experience.type].label}
            </Badge>
            <h3 className="font-bold text-base line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1">
              {experience.title}
            </h3>
          </div>

          {/* 公司和职位信息 */}
          {(experience.company || experience.jobTitle) && (
            <div className="flex items-center gap-3">
              {experience.company && (
                <div className="flex items-center gap-2">
                  {experience.company.logo ? (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={experience.company.logo} alt={experience.company.name} />
                      <AvatarFallback className="text-xs">
                        {experience.company.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{experience.company.name}</span>
                </div>
              )}
              {experience.jobTitle && (
                <>
                  {experience.company && <span className="text-muted-foreground">·</span>}
                  <span className="text-sm text-muted-foreground">{experience.jobTitle}</span>
                </>
              )}
            </div>
          )}

          {/* 难度和阅读时长 */}
          <div className="flex items-center gap-4">
            {experience.difficulty && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">难度</span>
                <DifficultyStars level={experience.difficulty} />
              </div>
            )}
            {experience.readTime && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{experience.readTime}分钟阅读</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 内容预览 */}
        {experience.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {experience.content}
          </p>
        )}

        {/* 标签 */}
        {experience.tags && experience.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {experience.tags.slice(0, 5).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {experience.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{experience.tags.length - 5}
              </Badge>
            )}
          </div>
        )}

        {/* 作者信息 */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={experience.author.avatar} alt={experience.author.name} />
            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              {experience.author.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{experience.author.name}</p>
              {experience.author.isVerified && (
                <Badge variant="secondary" className="text-xs h-4">
                  已认证
                </Badge>
              )}
            </div>
            {experience.author.university && (
              <p className="text-xs text-muted-foreground truncate">
                {experience.author.university}
                {experience.author.graduationYear && ` · ${experience.author.graduationYear}届`}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(experience.createdAt)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {experience.viewCount !== undefined && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {experience.viewCount > 1000 ? `${(experience.viewCount / 1000).toFixed(1)}k` : experience.viewCount}
              </span>
            )}
            {experience.likeCount !== undefined && (
              <button
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onLike?.()
                }}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {experience.likeCount}
              </button>
            )}
            {experience.commentCount !== undefined && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {experience.commentCount}
              </span>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            阅读全文
          </Badge>
        </div>
      </CardFooter>
    </Card>
  )
}