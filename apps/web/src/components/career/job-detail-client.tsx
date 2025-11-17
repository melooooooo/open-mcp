"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, DollarSign, Calendar, Clock, Users, Building2, Star, Bookmark, Share2, Flag } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { JobCard } from "@/components/career/job-card"
import { mockJobs } from "@/data/mock-data"
import Link from "next/link"

interface JobDetailClientProps {
  jobId: string
}

export function JobDetailClient({ jobId }: JobDetailClientProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  // 模拟根据ID获取职位详情
  const job = mockJobs.find(j => j.id === jobId) || mockJobs[0]
  
  // 相关职位推荐
  const relatedJobs = mockJobs.filter(j => 
    j.id !== job.id && 
    (j.company.name === job.company.name || j.tags?.some(tag => job.tags?.includes(tag)))
  ).slice(0, 3)
  
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return "薪资面议"
    if (!max) return `${min}k起`
    if (min === max) return `${min}k`
    return `${min}-${max}k`
  }

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return "已截止"
    if (days === 0) return "今日截止"
    if (days <= 7) return `剩${days}天`
    return `${Math.ceil(days / 7)}周后截止`
  }

  const jobTypeMap = {
    fulltime: "全职",
    intern: "实习", 
    parttime: "兼职"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b">
        <div className="container py-4">
          <Link href="/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回职位列表
            </Button>
          </Link>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 主内容 */}
          <div className="flex-1 space-y-6">
            {/* 职位标题卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 ring-4 ring-gray-100 dark:ring-gray-800">
                      <AvatarImage src={job.company.logo} alt={job.company.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-lg">
                        {job.company.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold">{job.title}</h1>
                        {job.isHot && (
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
                            🔥 热门
                          </Badge>
                        )}
                        {job.isNew && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                            ✨ 新发布
                          </Badge>
                        )}
                      </div>
                      <div className="text-lg text-muted-foreground mb-3">{job.company.name}</div>
                      
                      {/* 关键信息 */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          <span className="font-semibold text-orange-600 dark:text-orange-400">
                            {formatSalary(job.salaryMin, job.salaryMax)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{job.location.join("、")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{jobTypeMap[job.jobType]}</span>
                        </div>
                        {job.educationRequirement && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{job.educationRequirement}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={isBookmarked ? "text-orange-500" : ""}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Flag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* 标签 */}
                {job.tags && job.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 统计信息 */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                  {job.viewCount !== undefined && (
                    <span>{job.viewCount} 人浏览</span>
                  )}
                  {job.applicationCount !== undefined && (
                    <span>{job.applicationCount} 人申请</span>
                  )}
                  {job.applicationDeadline && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {getDaysLeft(job.applicationDeadline)}
                    </span>
                  )}
                </div>

                {/* 立即申请按钮 */}
                <div className="flex gap-3">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    立即申请
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 详细信息 */}
            <Card>
              <Tabs defaultValue="description" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="description">职位详情</TabsTrigger>
                    <TabsTrigger value="requirements">任职要求</TabsTrigger>
                    <TabsTrigger value="company">公司信息</TabsTrigger>
                    <TabsTrigger value="benefits">福利待遇</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <TabsContent value="description" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">工作职责</h3>
                      <div className="prose dark:prose-invert max-w-none">
                        <ul className="space-y-2">
                          <li>负责前端架构设计，制定前端技术方案和开发规范</li>
                          <li>参与产品需求分析，与产品经理、设计师协作完成项目开发</li>
                          <li>编写高质量、可维护的前端代码，确保代码质量和性能</li>
                          <li>参与技术选型，推动前端技术栈的升级和优化</li>
                          <li>指导初级开发者，参与代码评审和技术分享</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="requirements" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">任职要求</h3>
                      <div className="prose dark:prose-invert max-w-none">
                        <ul className="space-y-2">
                          <li>计算机相关专业本科及以上学历，3年以上前端开发经验</li>
                          <li>精通 JavaScript、TypeScript、HTML5、CSS3 等前端技术</li>
                          <li>熟练使用 React、Vue 等主流前端框架，有大型项目开发经验</li>
                          <li>熟悉前端工程化工具，如 Webpack、Vite、Rollup 等</li>
                          <li>具备良好的代码习惯和团队协作能力</li>
                          <li>有 Node.js 开发经验者优先</li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="company" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">公司介绍</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        字节跳动成立于2012年，是全球领先的移动互联网公司。公司使命是"激发创造，丰富生活"，
                        旗下产品包括抖音、今日头条、西瓜视频、TikTok等，服务超过15亿用户。
                        我们致力于为用户提供优质内容和服务，推动信息的创造与分享。
                      </p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">公司规模</div>
                        <div className="font-medium">10000+ 人</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">所属行业</div>
                        <div className="font-medium">互联网/移动互联网</div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="benefits" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">福利待遇</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          "五险一金", "年终奖金", "股票期权", "带薪年假",
                          "弹性工作", "免费午餐", "健身房", "班车服务",
                          "培训机会", "节日福利", "团建活动", "医疗保险"
                        ].map((benefit, index) => (
                          <Badge key={index} variant="secondary" className="justify-center">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* 侧边栏 */}
          <div className="lg:w-80 space-y-6">

            {/* 相关职位推荐 */}
            {relatedJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">相关职位推荐</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedJobs.map(relatedJob => (
                    <JobCard
                      key={relatedJob.id}
                      job={relatedJob}
                      variant="compact"
                      onClick={() => window.open(`/jobs/${relatedJob.id}`, '_blank')}
                      onBookmark={() => console.log('Bookmark job:', relatedJob.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 申请建议 */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  申请建议
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p>简历中突出相关项目经验和技术栈匹配度</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p>准备技术面试，复习算法和系统设计</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p>了解公司文化和产品，准备行为面试</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
