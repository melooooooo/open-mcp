"use client"

import Image from "next/image"
import { Star, Eye, ThumbsUp, MessageSquare, BookOpen, FileText, Briefcase, Clock, ImageOff } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { cn } from "@repo/ui/lib/utils"

import { useState, useCallback } from "react"
import { toggleExperienceLike } from "@/app/actions/interactions"
import { toast } from "sonner"

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
    cover_asset_path?: string // 封面图片URL
    isLiked?: boolean
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
  const [isLiked, setIsLiked] = useState(experience.isLiked || false)
  const [likeCount, setLikeCount] = useState(experience.likeCount || 0)
  const [isLoading, setIsLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return

    // Optimistic update
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
    setIsLoading(true)

    try {
      const result = await toggleExperienceLike(experience.id)
      if (result.error) {
        // Revert on error
        setIsLiked(!newIsLiked)
        setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1)
        if (result.error === "Unauthorized") {
          toast.error("请先登录")
        } else {
          toast.error("操作失败，请重试")
        }
      } else {
        // Sync with server result just in case
        if (result.isLiked !== undefined) {
          setIsLiked(result.isLiked)
        }
        onLike?.()
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!newIsLiked)
      setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1)
      toast.error("网络错误，请重试")
    } finally {
      setIsLoading(false)
    }
  }

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
              <button
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  isLiked ? "text-red-500" : "hover:text-blue-600 dark:hover:text-blue-400"
                )}
                onClick={handleLike}
              >
                <ThumbsUp className={cn("h-3 w-3", isLiked && "fill-current")} />
                {likeCount}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 列表样式：标题、作者、发布时间/公司
  if (variant === "list") {
    const hasCoverImage = typeof experience.cover_asset_path === 'string' && experience.cover_asset_path && !imageError

    return (
      <Card className={cn("group cursor-pointer hover:bg-muted/50 transition-all duration-300 border-0 bg-transparent", className)} onClick={onClick}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-4">
            {/* 封面图片 OR 图标区域 */}
            {hasCoverImage ? (
              <div className="hidden sm:block shrink-0">
                <div className="relative w-[160px] h-[100px] rounded-lg overflow-hidden bg-muted/50 border border-border/50 shadow-sm group-hover:shadow-md transition-all duration-300">
                  <Image
                    src={experience.cover_asset_path!}
                    alt={experience.title}
                    fill
                    sizes="(max-width: 640px) 0vw, 160px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={handleImageError}
                  />
                </div>
              </div>
            ) : (
              /* 无封面图或图片加载失败时显示图标 */
              <div className="hidden sm:flex flex-col items-center gap-2 pt-1 shrink-0">
                <div className={cn(
                  "flex items-center justify-center w-[160px] h-[100px] rounded-lg transition-all duration-300 group-hover:shadow-md border border-border/50",
                  imageError ? "bg-muted/30" : typeConfig[experience.type].color
                )}>
                  {imageError ? (
                    <ImageOff className="w-8 h-8 text-muted-foreground/50" />
                  ) : (
                    <TypeIcon className="w-10 h-10" />
                  )}
                </div>
              </div>
            )}

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
                  <button
                    className={cn(
                      "flex items-center gap-1.5 transition-colors",
                      isLiked ? "text-red-500" : "hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                    onClick={handleLike}
                  >
                    <ThumbsUp className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                    <span>{likeCount}</span>
                  </button>
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
            <button
              className={cn(
                "flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors",
                isLiked ? "text-red-500" : ""
              )}
              onClick={handleLike}
            >
              <ThumbsUp className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
              {likeCount}
            </button>
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