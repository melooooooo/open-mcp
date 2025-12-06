"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { cn } from "@repo/ui/lib/utils"
import { toggleScrapedJobCollection } from "@/app/actions/interactions"
import { toast } from "sonner"

interface CollectButtonProps {
  jobId: string
  initialCollected?: boolean
  size?: "default" | "sm" | "lg"
  className?: string
}

export function CollectButton({
  jobId,
  initialCollected = false,
  size = "default",
  className
}: CollectButtonProps) {
  const [isCollected, setIsCollected] = useState(initialCollected)
  const [isLoading, setIsLoading] = useState(false)

  const handleCollect = async () => {
    if (isLoading) return

    const currentStatus = isCollected
    const newStatus = !currentStatus

    // Optimistic update
    setIsCollected(newStatus)
    setIsLoading(true)

    try {
      const result = await toggleScrapedJobCollection(jobId)
      if (result.error) {
        // Rollback
        setIsCollected(currentStatus)
        if (result.error === "Unauthorized") {
          toast.error("请先登录")
        } else {
          toast.error("操作失败，请重试")
        }
      } else {
        if (result.isCollected !== undefined) {
          setIsCollected(result.isCollected)
        }
        toast.success(newStatus ? "已收藏" : "已取消收藏")
      }
    } catch (error) {
      // Rollback
      setIsCollected(currentStatus)
      toast.error("网络错误，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    default: "h-10 px-4",
    lg: "h-12 px-6 text-lg"
  }

  return (
    <Button
      variant={isCollected ? "default" : "outline"}
      className={cn(
        sizeClasses[size],
        "gap-2 transition-all",
        isCollected
          ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          : "border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400",
        className
      )}
      onClick={handleCollect}
      disabled={isLoading}
    >
      <Star className={cn("w-4 h-4", isCollected && "fill-current")} />
      {isCollected ? "已收藏" : "收藏"}
    </Button>
  )
}
