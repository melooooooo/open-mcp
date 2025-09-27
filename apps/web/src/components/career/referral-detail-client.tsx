"use client"

import { useState } from "react"
import { ArrowLeft, MapPin, DollarSign, Calendar, Clock, Users, Building2, Star, MessageCircle, Share2, CheckCircle, TrendingUp, Award, Shield, Zap } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Progress } from "@repo/ui/components/ui/progress"
import { Separator } from "@repo/ui/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { ReferralCard } from "@/components/career/referral-card"
import { mockReferrals } from "@/data/mock-data"
import Link from "next/link"
import { cn } from "@repo/ui/lib/utils"

interface ReferralDetailClientProps {
  referralId: string
}

export function ReferralDetailClient({ referralId }: ReferralDetailClientProps) {
  const [isApplied, setIsApplied] = useState(false)
  const [message, setMessage] = useState("")
  
  // 模拟根据ID获取内推详情
  const referral = mockReferrals.find(r => r.id === referralId) || mockReferrals[0]
  
  // 相关内推机会
  const relatedReferrals = mockReferrals.filter(r => 
    r.id !== referral.id && 
    (r.referrer.company === referral.referrer.company || 
     r.job.title.includes(referral.job.title.split(' ')[0]))
  ).slice(0, 3)

  const quotaPercentage = (referral.quotaUsed / referral.quotaTotal) * 100
  const quotaRemaining = referral.quotaTotal - referral.quotaUsed
  const isQuotaFull = quotaRemaining === 0

  const getDaysLeft = (deadline?: string) => {
    if (!deadline) return null
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (days < 0) return "已结束"
    if (days === 0) return "今日截止"
    if (days <= 7) return `剩${days}天`
    return `${Math.ceil(days / 7)}周后截止`
  }

  const daysLeft = getDaysLeft(referral.validUntil)

  // 模拟评价数据
  const reviews = [
    {
      id: "1",
      author: "张同学",
      university: "清华大学",
      rating: 5,
      content: "内推官非常专业，提供了很多有价值的建议，帮助我成功通过了面试！",
      createdAt: "2024-03-15",
      helpful: 23
    },
    {
      id: "2", 
      author: "李同学",
      university: "北京大学",
      rating: 5,
      content: "响应速度很快，对简历提出了很多改进建议，最终成功拿到offer。",
      createdAt: "2024-03-10",
      helpful: 18
    },
    {
      id: "3",
      author: "王同学",
      university: "复旦大学",
      rating: 4,
      content: "内推流程很顺利，但是HR反馈比较慢，不过最终还是通过了。",
      createdAt: "2024-03-05",
      helpful: 12
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="border-b">
        <div className="container py-4">
          <Link href="/referrals">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回内推列表
            </Button>
          </Link>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 主内容 */}
          <div className="flex-1 space-y-6">
            {/* 内推官信息卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20 ring-4 ring-orange-100 dark:ring-orange-900/30">
                      <AvatarImage src={referral.referrer.avatar} alt={referral.referrer.name} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white text-lg">
                        {referral.referrer.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold">{referral.referrer.name}</h1>
                        {referral.referrer.isVerified && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            已认证
                          </Badge>
                        )}
                        {referral.referrer.totalReferred && referral.referrer.totalReferred > 10 && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                            <Award className="h-3 w-3 mr-1" />
                            金牌内推官
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg text-muted-foreground mb-3">
                        {referral.referrer.title} @ {referral.referrer.company}
                        {referral.referrer.department && ` · ${referral.referrer.department}`}
                      </p>
                      
                      {/* 统计数据 */}
                      <div className="flex flex-wrap gap-6 text-sm">
                        {referral.referrer.successRate !== undefined && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="font-semibold">{referral.referrer.successRate}%</span>
                            <span className="text-muted-foreground">成功率</span>
                          </div>
                        )}
                        {referral.referrer.totalReferred && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">{referral.referrer.totalReferred}</span>
                            <span className="text-muted-foreground">人已成功</span>
                          </div>
                        )}
                        {referral.rating && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{referral.rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">评分</span>
                            {referral.reviews && (
                              <span className="text-xs text-muted-foreground">({referral.reviews}条评价)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* 职位信息 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4">
                  <h2 className="font-bold text-lg mb-3">{referral.job.title}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {referral.job.department && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{referral.job.department}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{referral.job.location.join("、")}</span>
                    </div>
                    {referral.job.salaryRange && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {referral.job.salaryRange}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 名额进度 */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">内推名额</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      isQuotaFull ? "text-red-600 dark:text-red-400" : 
                      quotaPercentage > 70 ? "text-yellow-600 dark:text-yellow-400" : 
                      "text-green-600 dark:text-green-400"
                    )}>
                      {referral.quotaUsed}/{referral.quotaTotal} 已使用
                    </span>
                  </div>
                  <Progress 
                    value={quotaPercentage} 
                    className="h-3"
                  />
                  {!isQuotaFull && quotaRemaining <= 3 && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                      ⚡ 仅剩 {quotaRemaining} 个名额，抓紧申请！
                    </p>
                  )}
                  {daysLeft && (
                    <Badge 
                      variant={daysLeft.includes("剩") || daysLeft.includes("今日") ? "destructive" : "secondary"}
                      className="w-fit"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      {daysLeft}
                    </Badge>
                  )}
                </div>

                {/* 申请按钮 */}
                <div className="flex gap-3">
                  <Button 
                    size="lg" 
                    disabled={isQuotaFull || isApplied}
                    onClick={() => setIsApplied(true)}
                    className={cn(
                      !isQuotaFull && !isApplied && 
                      "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                    )}
                  >
                    {isApplied ? "已申请" : isQuotaFull ? "名额已满" : "立即申请内推"}
                  </Button>
                  <Button variant="outline" size="lg">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    咨询内推官
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 详细信息标签页 */}
            <Card>
              <Tabs defaultValue="description" className="w-full">
                <CardHeader>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="description">内推说明</TabsTrigger>
                    <TabsTrigger value="requirements">申请要求</TabsTrigger>
                    <TabsTrigger value="process">内推流程</TabsTrigger>
                    <TabsTrigger value="reviews">评价反馈</TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <TabsContent value="description" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">内推官介绍</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {referral.description || 
                          "我是字节跳动的高级工程师，在公司工作3年，熟悉公司的招聘流程和面试要求。可以帮助你优化简历，提供面试指导，推荐到合适的岗位。我们团队氛围很好，技术栈先进，有很多学习和成长的机会。"}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">为什么选择我的内推？</h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Shield className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">专业可靠</p>
                            <p className="text-sm text-muted-foreground">3年大厂经验，熟悉招聘流程和面试重点</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Zap className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">快速响应</p>
                            <p className="text-sm text-muted-foreground">24小时内回复，快速推进内推流程</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Award className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium">成功率高</p>
                            <p className="text-sm text-muted-foreground">85%的内推成功率，已帮助30+同学拿到offer</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="requirements" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">基本要求</h3>
                      {referral.requirements && referral.requirements.length > 0 ? (
                        <ul className="space-y-2">
                          {referral.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                              <span className="text-muted-foreground">{req}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span className="text-muted-foreground">2024/2025届应届生，本科及以上学历</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span className="text-muted-foreground">计算机相关专业优先</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span className="text-muted-foreground">有相关项目经验或实习经历</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span className="text-muted-foreground">良好的编程能力和算法基础</span>
                          </li>
                        </ul>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">加分项</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                          <span className="text-muted-foreground">有开源项目贡献经历</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                          <span className="text-muted-foreground">ACM/蓝桥杯等竞赛获奖经历</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                          <span className="text-muted-foreground">知名互联网公司实习经历</span>
                        </li>
                      </ul>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="process" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">内推流程</h3>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-sm">
                            1
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">提交申请</p>
                            <p className="text-sm text-muted-foreground">填写基本信息，上传简历</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-sm">
                            2
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">简历优化</p>
                            <p className="text-sm text-muted-foreground">内推官审核简历，提供优化建议</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-sm">
                            3
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">内推投递</p>
                            <p className="text-sm text-muted-foreground">通过内部系统投递简历</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-sm">
                            4
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">面试辅导</p>
                            <p className="text-sm text-muted-foreground">提供面试技巧和经验分享</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-semibold text-sm">
                            5
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">结果反馈</p>
                            <p className="text-sm text-muted-foreground">及时同步面试进度和结果</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="reviews" className="space-y-4">
                    <div className="space-y-4">
                      {reviews.map(review => (
                        <div key={review.id} className="space-y-2 p-4 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                                  {review.author.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{review.author}</p>
                                <p className="text-xs text-muted-foreground">{review.university}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star 
                                  key={i}
                                  className={cn(
                                    "h-4 w-4",
                                    i <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{review.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{review.createdAt}</span>
                            <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                              有帮助 ({review.helpful})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* 申请表单（当点击申请后显示） */}
            {isApplied && (
              <Card>
                <CardHeader>
                  <CardTitle>申请信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">自我介绍（选填）</label>
                    <Textarea
                      placeholder="简单介绍一下自己，让内推官更了解你..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-2"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      申请已提交！内推官会在24小时内联系你。
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="lg:w-80 space-y-6">
            {/* 内推官服务承诺 */}
            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  服务承诺
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <p>24小时内响应申请</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <p>一对一简历优化指导</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <p>面试技巧和经验分享</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <p>全程跟进反馈结果</p>
                </div>
              </CardContent>
            </Card>

            {/* 其他内推机会 */}
            {relatedReferrals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">其他内推机会</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {relatedReferrals.map(related => (
                    <ReferralCard
                      key={related.id}
                      referral={related}
                      variant="compact"
                      onClick={() => window.location.href = `/referrals/${related.id}`}
                      onApply={() => console.log('Apply for referral:', related.id)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* 常见问题 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">常见问题</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">内推是否收费？</p>
                  <p className="text-muted-foreground">不收费，纯公益帮助应届生。</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium mb-1">内推成功率如何？</p>
                  <p className="text-muted-foreground">取决于个人能力和岗位匹配度，平均成功率在60%以上。</p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium mb-1">需要准备什么材料？</p>
                  <p className="text-muted-foreground">最新的简历PDF，成绩单（如需），项目作品集（如有）。</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}