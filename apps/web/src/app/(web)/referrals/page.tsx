"use client"

import { useState } from "react"
import { Search, Filter, Users, TrendingUp, Award, Building2, SlidersHorizontal } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Badge } from "@repo/ui/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Slider } from "@repo/ui/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { ReferralCard } from "@/components/career/referral-card"
import { mockReferrals } from "@/data/mock-data"

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [successRateFilter, setSuccessRateFilter] = useState<number[]>([0])
  const [showFilters, setShowFilters] = useState(false)

  // 获取所有公司和地点
  const companies = Array.from(new Set(mockReferrals.map(r => r.referrer.company))).sort()
  const locations = Array.from(new Set(mockReferrals.flatMap(r => r.job.location))).sort()

  // 热门内推官
  const topReferrers = [
    { name: "张三", company: "字节跳动", successRate: 85, totalReferred: 32 },
    { name: "李四", company: "阿里巴巴", successRate: 78, totalReferred: 28 },
    { name: "王五", company: "腾讯", successRate: 82, totalReferred: 25 },
  ]

  const filteredReferrals = mockReferrals.filter(referral => {
    const matchesSearch = 
      referral.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referrer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.referrer.company.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCompany = !selectedCompany || referral.referrer.company === selectedCompany
    
    const matchesLocation = !selectedLocation || 
      referral.job.location.some(loc => loc === selectedLocation)
    
    const matchesSuccessRate = !referral.referrer.successRate || 
      referral.referrer.successRate >= successRateFilter[0]
    
    return matchesSearch && matchesCompany && matchesLocation && matchesSuccessRate
  })

  // 统计数据
  const stats = {
    totalReferrals: mockReferrals.length,
    activeReferrers: new Set(mockReferrals.map(r => r.referrer.id)).size,
    avgSuccessRate: Math.round(
      mockReferrals.reduce((acc, r) => acc + (r.referrer.successRate || 0), 0) / 
      mockReferrals.filter(r => r.referrer.successRate).length
    ),
    totalQuota: mockReferrals.reduce((acc, r) => acc + (r.quotaTotal - r.quotaUsed), 0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
        <div className="container py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                内推机会
              </h1>
              <p className="text-muted-foreground mt-2">
                来自大厂在职员工的内推机会，提高求职成功率
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-4 py-2">
              <TrendingUp className="h-4 w-4 mr-2" />
              本周新增 {Math.floor(stats.totalReferrals * 0.3)} 个机会
            </Badge>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="container py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">内推机会</p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
                <Badge variant="secondary" className="text-green-600">
                  +12%
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">活跃内推官</p>
                  <p className="text-2xl font-bold">{stats.activeReferrers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均成功率</p>
                  <p className="text-2xl font-bold">{stats.avgSuccessRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">剩余名额</p>
                  <p className="text-2xl font-bold">{stats.totalQuota}</p>
                </div>
                <Award className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 筛选侧边栏 */}
          <div className={`lg:w-64 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-6">
              {/* 搜索框 */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="搜索职位、公司或内推官..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 筛选项 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    筛选条件
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 公司筛选 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">公司</label>
                    <Select value={selectedCompany || "all"} onValueChange={(value) => setSelectedCompany(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择公司" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部公司</SelectItem>
                        {companies.map(company => (
                          <SelectItem key={company} value={company}>{company}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 地点筛选 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">工作地点</label>
                    <Select value={selectedLocation || "all"} onValueChange={(value) => setSelectedLocation(value === "all" ? "" : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择地点" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部地点</SelectItem>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 成功率筛选 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      最低成功率：{successRateFilter[0]}%
                    </label>
                    <Slider
                      value={successRateFilter}
                      onValueChange={setSuccessRateFilter}
                      min={0}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCompany("")
                      setSelectedLocation("")
                      setSuccessRateFilter([0])
                    }}
                  >
                    重置筛选
                  </Button>
                </CardContent>
              </Card>

              {/* 明星内推官 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    明星内推官
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topReferrers.map((referrer, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{referrer.name}</p>
                        <p className="text-xs text-muted-foreground">{referrer.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {referrer.successRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {referrer.totalReferred}人
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">
            {/* 移动端筛选按钮 */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="font-semibold">共 {filteredReferrals.length} 个内推机会</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                筛选
              </Button>
            </div>

            {/* 排序选项 */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <h2 className="font-semibold">共 {filteredReferrals.length} 个内推机会</h2>
              <Select defaultValue="success-rate">
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success-rate">成功率最高</SelectItem>
                  <SelectItem value="quota">剩余名额最多</SelectItem>
                  <SelectItem value="newest">最新发布</SelectItem>
                  <SelectItem value="deadline">即将截止</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 内推列表 */}
            <div className="space-y-4">
              {filteredReferrals.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-medium mb-2">未找到匹配的内推机会</h3>
                    <p className="text-muted-foreground">尝试调整筛选条件或搜索关键词</p>
                  </CardContent>
                </Card>
              ) : (
                filteredReferrals.map(referral => (
                  <ReferralCard 
                    key={referral.id} 
                    referral={referral}
                    onClick={() => window.open(`/referrals/${referral.id}`, '_blank')}
                    onApply={() => console.log('Apply for referral:', referral.id)}
                  />
                ))
              )}
            </div>

            {/* 加载更多 */}
            {filteredReferrals.length > 0 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  加载更多内推机会
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}