"use client"

import { useState } from "react"
import { ThumbsUp } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"
import { Button } from "@repo/ui/components/ui/button"
import { toggleExperienceLike } from "@/app/actions/interactions"
import { toast } from "sonner"

interface ExperienceLikeButtonProps {
  experienceId: string
  initialIsLiked: boolean
  initialLikeCount: number
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ExperienceLikeButton({
  experienceId,
  initialIsLiked,
  initialLikeCount,
  className,
  variant = "outline",
  size = "default"
}: ExperienceLikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleLike = async () => {
    if (isLoading) return

    // Optimistic update
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1)
    setIsLoading(true)

    try {
      const result = await toggleExperienceLike(experienceId)
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

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "gap-2 transition-colors",
        isLiked && "text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:hover:bg-red-900/30",
        className
      )}
      onClick={handleLike}
      disabled={isLoading}
    >
      <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-current")} />
      <span>{likeCount}</span>
      <span className="sr-only">Like</span>
    </Button>
  )
}
