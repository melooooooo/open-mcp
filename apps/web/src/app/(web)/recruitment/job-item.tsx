"use client"

import Link from "next/link"
import { Badge } from "@repo/ui/components/ui/badge"
import { MapPin, GraduationCap, Calendar, ExternalLink, Building2, Star } from "lucide-react"
import type { JobListing } from "@/lib/api/job-listings"
import { cn } from "@repo/ui/lib/utils"
import { useState } from "react"
import { toggleJobListingCollection } from "@/app/actions/interactions"
import { toast } from "sonner"
import { Button } from "@repo/ui/components/ui/button"

interface JobItemProps {
  job: JobListing
  isCollected?: boolean
}

export function JobItem({ job, isCollected = false }: JobItemProps) {
  const isUrl = job.application_method.startsWith("http") || job.application_method.startsWith("www")
  const isEmail = job.application_method.includes("@")

  const [collected, setCollected] = useState(isCollected)
  const [isLoading, setIsLoading] = useState(false)

  const handleCollect = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLoading) return

    const newCollected = !collected
    setCollected(newCollected)
    setIsLoading(true)

    try {
      const result = await toggleJobListingCollection(job.id)
      if (result.error) {
        setCollected(!newCollected)
        if (result.error === "Unauthorized") {
          toast.error("请先登录")
        } else {
          toast.error("操作失败，请重试")
        }
      } else {
        if (result.isCollected !== undefined) {
          setCollected(result.isCollected)
        }
        toast.success(newCollected ? "已收藏" : "已取消收藏")
      }
    } catch (error) {
      setCollected(!newCollected)
      toast.error("网络错误，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  let applyLink = "#"
  if (isUrl) {
    applyLink = job.application_method.startsWith("http") ? job.application_method : `https://${job.application_method}`
  } else if (isEmail) {
    const emailMatch = job.application_method.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)
    if (emailMatch) {
      applyLink = `mailto:${emailMatch[0]}`
    }
  }

  return (
    <div className="group flex flex-col md:flex-row gap-4 p-6 bg-card hover:bg-muted/50 border rounded-xl transition-all hover:border-blue-200 hover:shadow-md relative">
      {/* Main Content */}
      <div className="flex-1 space-y-3">
        {/* Header: Company & Date */}
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-bold text-blue-700">
            {job.company_name}
          </h3>
          <Badge variant="secondary" className="font-normal">
            {job.company_type}
          </Badge>
          <span className="text-sm text-muted-foreground flex items-center ml-auto md:ml-0">
            <Calendar className="w-3.5 h-3.5 mr-1 text-blue-500" />
            {job.source_updated_at}
          </span>
        </div>

        {/* Job Title */}
        <div className="font-medium text-lg text-foreground/90">
          {job.job_title}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 shrink-0 text-blue-500" />
            <span>{job.work_location}</span>
          </div>
          <div className="flex items-center">
            <GraduationCap className="w-4 h-4 mr-1.5 shrink-0 text-blue-500" />
            <span>{job.degree_requirement}</span>
          </div>
          <div className="flex items-center px-2 py-0.5 bg-muted rounded text-xs font-medium">
            {job.session}
          </div>
          {job.batch && (
            <div className="flex gap-2">
              {job.batch.split(/[,，、]/).map((tag, i) => (
                tag.trim() && (
                  <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                    {tag.trim()}
                  </span>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Button (Right side on desktop) */}
      <div className="flex md:flex-col justify-end md:justify-center shrink-0 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-lg transition-colors",
            collected ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50" : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50"
          )}
          onClick={handleCollect}
          title={collected ? "取消收藏" : "收藏职位"}
        >
          <Star className={cn("w-5 h-5", collected && "fill-current")} />
        </Button>

        {isUrl ? (
          <Link
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center h-10 px-6 rounded-lg font-medium transition-colors",
              "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            )}
          >
            立即投递 <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        ) : isEmail ? (
          <a
            href={applyLink}
            className={cn(
              "inline-flex items-center justify-center h-10 px-6 rounded-lg font-medium transition-colors",
              "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            发送邮件 <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        ) : (
          <div className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-muted text-muted-foreground cursor-not-allowed text-sm">
            {job.application_method.substring(0, 8)}...
          </div>
        )}
      </div>
    </div>
  )
}

