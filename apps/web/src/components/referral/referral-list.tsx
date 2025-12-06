"use client"

import Link from "next/link"
import { useState } from "react"
import { Calendar, MessageSquare, Star } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { cn } from "@repo/ui/lib/utils"
import { toggleScrapedJobCollection } from "@/app/actions/interactions"
import { toast } from "sonner"

interface Job {
  id: string
  title: string
  link: string
  publish_date: string | null
  reply_count: number | null
  source: string | null
}

interface ReferralListProps {
  jobs: Job[]
  collectionStatus?: Record<string, boolean>
}

export function ReferralList({ jobs, collectionStatus = {} }: ReferralListProps) {
  const [localStatus, setLocalStatus] = useState<Record<string, boolean>>(collectionStatus)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const handleCollect = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (loadingIds.has(jobId)) return

    const currentStatus = localStatus[jobId] || false
    const newStatus = !currentStatus

    // Optimistic update
    setLocalStatus(prev => ({ ...prev, [jobId]: newStatus }))
    setLoadingIds(prev => new Set(prev).add(jobId))

    try {
      const result = await toggleScrapedJobCollection(jobId)
      if (result.error) {
        // Rollback
        setLocalStatus(prev => ({ ...prev, [jobId]: currentStatus }))
        if (result.error === "Unauthorized") {
          toast.error("请先登录")
        } else {
          toast.error("操作失败，请重试")
        }
      } else {
        if (result.isCollected !== undefined) {
          setLocalStatus(prev => ({ ...prev, [jobId]: result.isCollected! }))
        }
        toast.success(newStatus ? "已收藏" : "已取消收藏")
      }
    } catch (error) {
      // Rollback
      setLocalStatus(prev => ({ ...prev, [jobId]: currentStatus }))
      toast.error("网络错误，请重试")
    } finally {
      setLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  if (!jobs.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无内推职位
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => {
        const isCollected = localStatus[job.id] || false
        const isLoading = loadingIds.has(job.id)

        return (
          <Card key={job.id} className="hover:shadow-md transition-all hover:border-blue-200 group relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg font-medium line-clamp-2 flex-1" title={job.title}>
                  <Link href={`/referrals/${job.id}`} className="group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </Link>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 shrink-0 rounded-full transition-colors",
                    isCollected
                      ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      : "text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                  )}
                  onClick={(e) => handleCollect(e, job.id)}
                  disabled={isLoading}
                  title={isCollected ? "取消收藏" : "收藏职位"}
                >
                  <Star className={cn("w-4 h-4", isCollected && "fill-current")} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-400" />
                    <span>{job.publish_date || "未知日期"}</span>
                  </div>
                  {job.reply_count !== null && (
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3 text-blue-400" />
                      <span>{job.reply_count} 回复</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
