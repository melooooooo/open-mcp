"use client"

import { useState } from "react"
import { Search, Filter, MapPin, Building2, DollarSign, SlidersHorizontal } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Badge } from "@repo/ui/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { JobCard } from "@/components/career/job-card"

interface JobsClientProps {
  jobs: any[]
}

export function JobsClient({ jobs }: JobsClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [selectedJobType, setSelectedJobType] = useState<string>("")
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)

  const locations = ["北京", "上海", "深圳", "杭州", "广州", "成都", "南京", "武汉"]
  const jobTypes = ["全职", "实习", "兼职"]
  const salaryRanges = ["5k以下", "5-10k", "10-15k", "15-25k", "25-35k", "35k以上"]
  const popularTags = ["前端开发", "后端开发", "算法工程师", "产品经理", "UI设计", "数据分析", "运营", "测试"]

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLocation = !selectedLocation || job.location.some((loc: string) => loc.includes(selectedLocation))
    
    const matchesJobType = !selectedJobType || 
      (selectedJobType === "全职" && job.jobType === "fulltime") ||
      (selectedJobType === "实习" && job.jobType === "intern") ||
      (selectedJobType === "兼职" && job.jobType === "parttime")
    
    const matchesSalary = !selectedSalaryRange || checkSalaryRange(job, selectedSalaryRange)
    
    return matchesSearch && matchesLocation && matchesJobType && matchesSalary
  })

  function checkSalaryRange(job: any, range: string) {
    const min = job.salaryMin || 0
    const max = job.salaryMax || 0
    
    switch (range) {
      case "5k以下": return max < 5
      case "5-10k": return (min >= 5 && max <= 10) || (min < 5 && max > 5)
      case "10-15k": return (min >= 10 && max <= 15) || (min < 10 && max > 10)
      case "15-25k": return (min >= 15 && max <= 25) || (min < 15 && max > 15)
      case "25-35k": return (min >= 25 && max <= 35) || (min < 25 && max > 25)
      case "35k以上": return min >= 35
      default: return true
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 页面标题 */}
      <div className="border-b bg-muted/30">
        <div className="container py-8">
          <h1 className="text-3xl font-bold">职位搜索</h1>
          <p className="text-muted-foreground mt-2">发现 {filteredJobs.length} 个优质职位机会</p>
        </div>
      </div>

      <div className="container py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 筛选侧边栏 */}
          <div className={`lg:w-64 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-6">
              {/* 搜索框 */}
              <div className="space-y-4 p-4 border rounded-lg bg-card">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="搜索职位或公司..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* 筛选项 */}
              <div className="space-y-6 p-4 border rounded-lg bg-card">
                <h3 className="font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  筛选条件
                </h3>

                {/* 工作地点 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    工作地点
                  </h4>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择城市" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部城市</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 工作类型 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    工作类型
                  </h4>
                  <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部类型</SelectItem>
                      {jobTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 薪资范围 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5" />
                    薪资范围
                  </h4>
                  <Select value={selectedSalaryRange} onValueChange={setSelectedSalaryRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择薪资" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">不限薪资</SelectItem>
                      {salaryRanges.map(range => (
                        <SelectItem key={range} value={range}>{range}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* 重置筛选 */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedLocation("")
                    setSelectedJobType("")
                    setSelectedSalaryRange("")
                  }}
                >
                  重置筛选
                </Button>
              </div>

              {/* 热门标签 */}
              <div className="space-y-4 p-4 border rounded-lg bg-card">
                <h3 className="font-semibold">热门标签</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <Badge 
                      key={tag}
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setSearchQuery(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">
            {/* 移动端筛选按钮 */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="font-semibold">共 {filteredJobs.length} 个职位</h2>
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
              <h2 className="font-semibold">共 {filteredJobs.length} 个职位</h2>
              <Select defaultValue="newest">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">最新发布</SelectItem>
                  <SelectItem value="salary-high">薪资最高</SelectItem>
                  <SelectItem value="salary-low">薪资最低</SelectItem>
                  <SelectItem value="popular">最受欢迎</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 职位列表 */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium mb-2">未找到匹配的职位</h3>
                  <p className="text-muted-foreground">尝试调整筛选条件或搜索关键词</p>
                </div>
              ) : (
                filteredJobs.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job}
                    onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                    onBookmark={() => console.log('Bookmark job:', job.id)}
                  />
                ))
              )}
            </div>

            {/* 加载更多 */}
            {filteredJobs.length > 0 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg">
                  加载更多职位
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}