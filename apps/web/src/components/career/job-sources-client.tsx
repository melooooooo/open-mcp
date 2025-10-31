"use client"

import { useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert"
import { AlertCircle, Clock, Flame, GraduationCap, BriefcaseBusiness, Baby, Compass } from "lucide-react"
import { JobSourceCard, type JobSource } from "./job-source-card"
import { mockJobSources } from "@/data/mock-data"
import Link from "next/link"

// 顶部筛选标签配置
const quickFilters = [
  { key: "today", label: "今日更新", icon: Clock },
  { key: "hot", label: "热门", icon: Flame },
  { key: "campus", label: "校招", icon: GraduationCap },
  { key: "fulltime", label: "社招", icon: BriefcaseBusiness },
  { key: "intern", label: "实习", icon: Baby },
]

const platforms = [
  "牛客网",
  "北邮人导航",
  "智联招聘",
  "BOSS直聘",
  "拉勾",
  "实习僧",
]

export function JobSourcesClient() {
  const [activeFilter, setActiveFilter] = useState<string>("today")
  const [activePlatform, setActivePlatform] = useState<string>("全部平台")

  const sources = mockJobSources as JobSource[]

  const filtered = useMemo(() => {
    return sources.filter((s) => {
      const byFilter = activeFilter === "all" || s.tags?.includes(activeFilter)
      const byPlatform = activePlatform === "全部平台" || s.name.includes(activePlatform)
      return byFilter && byPlatform
    })
  }, [sources, activeFilter, activePlatform])

  return (
    <div className="min-h-screen bg-background">
      {/* 标题与说明 */}
      <div className="border-b bg-muted/30">
        <div className="container py-8">
          <h1 className="text-3xl font-bold">职位聚合</h1>
          <p className="text-muted-foreground mt-2">整合多平台的高质量职位来源，点击前往原站查看</p>
          <Alert className="mt-4 border-dashed">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>当前展示模拟数据</AlertTitle>
            <AlertDescription>
              你可以随时接入真实抓取/接口数据。需要传统列表搜索？前往
              <Link href="/jobs/search" className="underline underline-offset-4 ml-1">职位搜索</Link>
            </AlertDescription>
          </Alert>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* 快速筛选 */}
        <div className="flex flex-wrap gap-2">
          {quickFilters.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeFilter === key ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setActiveFilter(key)}
            >
              <Icon className="h-4 w-4 mr-1.5" />
              {label}
            </Button>
          ))}
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setActiveFilter("all")}
          >
            <Compass className="h-4 w-4 mr-1.5" />全部
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">平台</span>
          <div className="flex flex-wrap gap-2">
            <Badge
              key="全部平台"
              variant={activePlatform === "全部平台" ? "default" : "outline"}
              className="cursor-pointer rounded-full px-3 py-1"
              onClick={() => setActivePlatform("全部平台")}
            >
              全部平台
            </Badge>
            {platforms.map((p) => (
              <Badge
                key={p}
                variant={activePlatform === p ? "default" : "outline"}
                className="cursor-pointer rounded-full px-3 py-1"
                onClick={() => setActivePlatform(p)}
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* 网格卡片 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((s) => (
            <JobSourceCard key={s.id} source={s} />
          ))}
        </div>
      </div>
    </div>
  )
}

