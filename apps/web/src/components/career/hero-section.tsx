"use client"

import { Search, Briefcase, Users, TrendingUp, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Badge } from "@repo/ui/components/ui/badge"
import { useState } from "react"
import { cn } from "@repo/ui/lib/utils"

export function CareerHeroSection() {
  const [searchQuery, setSearchQuery] = useState("")

  const stats = [
    { label: "在招职位", value: "12,580+", icon: Briefcase, color: "text-blue-600 dark:text-blue-400" },
    { label: "合作企业", value: "2,456", icon: Users, color: "text-green-600 dark:text-green-400" },
    { label: "内推机会", value: "856", icon: TrendingUp, color: "text-orange-600 dark:text-orange-400" },
    { label: "求职成功率", value: "68%", icon: Sparkles, color: "text-purple-600 dark:text-purple-400" },
  ]

  const hotSearches = [
    "前端开发", "产品经理", "算法工程师", "Java开发", 
    "数据分析", "UI设计师", "运营", "测试工程师"
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 py-16 md:py-24">
      {/* 背景装饰 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-96 w-96 rounded-full bg-gradient-to-br from-orange-500/10 to-pink-500/10 blur-3xl" />
      </div>

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* 标签 */}
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            🎯 2025秋招进行中
          </Badge>

          {/* 主标题 */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            开启你的
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> 职业征程</span>
          </h1>

          {/* 副标题 */}
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            汇聚名企职位、内推机会、面试经验，助力应届生成功斩获心仪offer
          </p>

          {/* 搜索框 */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索职位、公司或关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10 pr-4 text-base"
              />
            </div>
            <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              搜索职位
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* 热门搜索 */}
          <div className="mb-12 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">热门搜索：</span>
            {hotSearches.map((term) => (
              <Badge
                key={term}
                variant="secondary"
                className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => setSearchQuery(term)}
              >
                {term}
              </Badge>
            ))}
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-lg border bg-card p-4 text-center transition-all hover:shadow-lg"
                >
                  <Icon className={cn("mx-auto mb-2 h-8 w-8", stat.color)} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              )
            })}
          </div>

          {/* CTA按钮组 */}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button variant="outline" size="lg" className="group">
              <Users className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              查看内推机会
            </Button>
            <Button variant="outline" size="lg" className="group">
              <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              浏览面试经验
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}