"use client"

import Link from "next/link"
import { Calendar, MessageSquare } from "lucide-react"
import { Badge } from "@repo/ui/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"

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
}

export function ReferralList({ jobs }: ReferralListProps) {
  if (!jobs.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        暂无内推职位
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <Card key={job.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium line-clamp-2" title={job.title}>
              <Link href={`/referrals/${job.id}`} className="hover:underline flex items-start gap-2">
                {job.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{job.publish_date || "未知日期"}</span>
                </div>
                {job.reply_count !== null && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{job.reply_count} 回复</span>
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                {job.source === 'byr_bbs' ? '北邮人论坛' : '其他来源'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
