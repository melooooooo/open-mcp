"use client"

import { ArrowRight, Flame, Sparkles } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { JobCard } from "./job-card"
import Link from "next/link"

interface JobSectionProps {
  title: string
  description?: string
  jobs: any[]
  showViewAll?: boolean
  variant?: "default" | "compact"
}

export function JobSection({ 
  title, 
  description, 
  jobs, 
  showViewAll = true,
  variant = "default" 
}: JobSectionProps) {
  return (
    <section className="py-12">
      <div className="container">
        {/* 标题区域 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              {title}
              {title?.includes("热门") && <Flame className="h-6 w-6 text-orange-500" />}
              {title?.includes("最新") && <Sparkles className="h-6 w-6 text-blue-500" />}
            </h2>
            {description && (
              <p className="mt-2 text-muted-foreground">{description}</p>
            )}
          </div>
          {showViewAll && (
            <Button variant="ghost" asChild>
              <Link href="/jobs">
                查看全部
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>

        {/* 职位卡片网格 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs?.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              variant={variant}
              onClick={() => console.log(`Navigate to job ${job.id}`)}
            />
          )) || []}
        </div>

        {/* 底部查看更多 */}
        {(jobs?.length || 0) >= 6 && (
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/jobs">
                发现更多职位
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}