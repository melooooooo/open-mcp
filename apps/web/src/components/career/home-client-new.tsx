"use client"

import { Button } from "@repo/ui/components/ui/button"
import {
  Search,
  MapPin,
  Newspaper,
  FileText,
  ChevronRight,
  Eye,
  Clock,
  MessageSquarePlus,
  ExternalLink,
  TrendingUp,
  Building2,
  Users
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { JobListing } from "@/lib/api/job-listings"

interface JobSite {
  id: string
  title: string
  description?: string
  website_url?: string
  tags?: string[]
  location?: string[]
  view_count?: number
  created_at?: string
}

interface Experience {
  id: string
  slug?: string
  title: string
  author?: {
    id: string
    name: string
  }
  company?: {
    name: string
  }
  jobTitle?: string
  viewCount?: number
  likeCount?: number
  createdAt?: string
  industry?: string
  isHot?: boolean
}

interface HomeClientNewProps {
  jobSites: JobSite[]
  experiences: Experience[]
  latestJobListings: JobListing[]
  stats: {
    totalJobSites: number
    totalExperiences: number
    totalJobListings: number
  }
}

export function HomeClientNew({ jobSites, experiences, latestJobListings, stats }: HomeClientNewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push('/search')
    }
  }

  const hotSearches = ["工商银行", "建设银行", "管培生", "金融科技", "数据分析", "客户经理", "风控", "产品经理"]

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return { day: "--", month: "---" }
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
    const month = months[date.getMonth()]
    return { day, month }
  }

  // 格式化时间差
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "未知"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "今天"
    if (diffDays === 1) return "昨天"
    if (diffDays < 7) return `${diffDays}天前`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`
    return `${Math.floor(diffDays / 30)}个月前`
  }

  // 获取标签显示
  const getTagDisplay = (site: JobSite) => {
    if (site.tags && site.tags.length > 0) {
      const tagMap: Record<string, string> = {
        'hot': '热门',
        'official': '官方',
        'campus': '校招',
        'intern': '实习',
        'fulltime': '社招',
        'today': '今日更新',
      }
      const firstTag = site.tags[0]
      if (firstTag) {
        return tagMap[firstTag] || firstTag
      }
    }
    return '推荐'
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-blue-100 dark:selection:bg-blue-500/30">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative pt-16 pb-12 overflow-hidden dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          {/* Dark mode background effects */}
          <div className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="hidden dark:block absolute top-20 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]"></div>
          <div className="hidden dark:block absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>

          <div className="container mx-auto px-4 relative z-10 text-center max-w-5xl">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-cyan-600/20 border border-blue-100 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs font-bold mb-8 shadow-sm dark:shadow-none">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              2025银行秋招进行中
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              开启你的 <span className="text-blue-700 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-blue-400 dark:via-cyan-400 dark:to-blue-500 relative inline-block">
                银行生涯
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-blue-200 dark:hidden -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl mb-12 font-normal max-w-2xl mx-auto leading-relaxed">
              汇聚银行、券商、保险职位、网站合集与面试经验
              <br className="hidden md:block" />
              应届生与社招的金融科技求职第一站
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto relative">
              <div className="hidden dark:block absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative flex items-center w-full h-16 rounded-full dark:rounded-2xl shadow-xl shadow-blue-900/5 dark:shadow-none border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/80 overflow-hidden hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/10 dark:hover:shadow-none transition-all duration-300 group">
                <Search className="absolute left-6 w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="搜索银行、岗位或关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full h-full pl-14 pr-40 bg-transparent border-none outline-none text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-lg"
                />
                <div className="absolute right-2 top-2 bottom-2">
                  <Button
                    onClick={handleSearch}
                    className="h-full px-8 rounded-full dark:rounded-xl bg-blue-600 dark:bg-gradient-to-r dark:from-blue-600 dark:to-blue-500 hover:bg-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-400 text-white font-bold text-base shadow-md dark:shadow-lg dark:shadow-blue-600/20 transition-all hover:shadow-lg dark:hover:shadow-blue-500/30"
                  >
                    搜索职位 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hot Tags */}
            <div className="mt-8 flex flex-wrap justify-center items-center gap-3 text-sm text-slate-500">
              <span className="text-slate-400 dark:text-slate-500">热门搜索：</span>
              {hotSearches.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSearchQuery(tag)
                    router.push(`/search?q=${encodeURIComponent(tag)}`)
                  }}
                  className="hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-100 dark:hover:border-blue-500/30 transition-all bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  {tag}
                </button>
              ))}
            </div>

          </div>
        </div>

        <div className="container mx-auto px-4 relative z-20 space-y-20 pb-24 dark:space-y-24 dark:pb-32">

          {/* 求职导航 Section */}
          <section>
            <div className="flex items-center justify-between mb-8 dark:mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 dark:bg-gradient-to-br dark:from-blue-600/20 dark:to-cyan-600/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">求职导航</h2>
                  <p className="text-slate-500 text-sm mt-1">汇聚全网优质招聘渠道，快速锁定热门机会</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl dark:border dark:border-transparent dark:hover:border-blue-500/20"
                asChild
              >
                <Link href="/jobs">
                  浏览全部导航 <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {jobSites.slice(0, 8).map((site) => (
                <Link
                  key={site.id}
                  href={site.website_url || `/jobs/${site.id}`}
                  target={site.website_url ? "_blank" : undefined}
                  className="group relative flex items-center p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 rounded-2xl hover:shadow-md dark:hover:shadow-none hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800/50 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Dark mode glow effect */}
                  <div className="hidden dark:block absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700 group-hover:border-blue-100 dark:group-hover:border-blue-500/30 transition-colors shadow-sm dark:shadow-none">
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {site.title.slice(0, 2)}
                    </span>
                  </div>
                  <div className="relative ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-2">
                        {site.title}
                      </h4>
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-500/20 whitespace-nowrap flex-shrink-0">
                        {getTagDisplay(site)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-1.5">
                      {site.description || '优质招聘渠道'}
                    </p>
                    <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-600 group-hover:text-blue-400/80 dark:group-hover:text-slate-500 transition-colors">
                      {site.website_url ? (
                        <>
                          <ExternalLink className="w-3 h-3 mr-0.5" /> 外部链接
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 mr-0.5" /> {site.view_count || 0} 次浏览
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {jobSites.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                暂无求职导航数据
              </div>
            )}
          </section>

          {/* 最新招聘动态 Section */}
          <section>
            <div className="flex items-center gap-4 mb-6 dark:mb-10">
              <div className="bg-blue-100 dark:bg-gradient-to-br dark:from-orange-600/20 dark:to-amber-600/20 p-2 dark:p-3 rounded-lg dark:rounded-2xl dark:border dark:border-orange-500/20">
                <Newspaper className="w-6 h-6 text-blue-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">最新招聘动态</h2>
                <p className="text-slate-500 text-sm mt-0.5">实时更新各行招聘信息，掌握第一手资讯</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/30 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800/50 divide-y divide-slate-50 dark:divide-slate-800/50 overflow-hidden dark:backdrop-blur-sm">
              {latestJobListings.slice(0, 5).map((job) => {
                const date = formatDate(job.source_updated_at || job.created_at)
                // Check if job is new (within 3 days)
                const isNew = new Date(job.source_updated_at || job.created_at).getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000

                return (
                  <Link
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    className="block p-6 flex gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  >
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-50 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-800/50 rounded-xl flex flex-col items-center justify-center border border-blue-100/50 dark:border-slate-700/50 text-blue-600 dark:text-white dark:group-hover:border-blue-500/30 transition-colors">
                      <span className="text-2xl font-bold leading-none dark:text-white">{date.day}</span>
                      <span className="text-xs font-medium uppercase mt-1 text-blue-400 dark:text-slate-500">{date.month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {job.job_title}
                        </h3>
                        {isNew && (
                          <span className="bg-orange-50 dark:bg-gradient-to-r dark:from-orange-500/20 dark:to-amber-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded text-xs font-bold border border-orange-100 dark:border-orange-500/30 flex-shrink-0 ml-2">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 text-sm mb-3 line-clamp-1 leading-relaxed">
                        {job.company_name}
                        {job.work_location && ` · ${job.work_location}`}
                        {job.industry_category && ` · ${job.industry_category}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTimeAgo(job.source_updated_at || job.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> {job.company_type || '企业'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {latestJobListings.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                暂无最新招聘信息
              </div>
            )}
          </section>

          {/* 经验分享 Section */}
          <section>
            <div className="flex items-center justify-between mb-6 dark:mb-10">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-600/20 dark:to-teal-600/20 p-2 dark:p-3 rounded-lg dark:rounded-2xl dark:border dark:border-emerald-500/20">
                  <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">经验分享</h2>
                  <p className="text-slate-500 text-sm mt-0.5">前辈经验，助你避坑</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-emerald-400 hover:bg-blue-50 dark:hover:bg-emerald-500/10 rounded-xl dark:border dark:border-transparent dark:hover:border-emerald-500/20"
                asChild
              >
                <Link href="/experiences">
                  查看更多 <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-900/30 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800/50 overflow-hidden dark:backdrop-blur-sm">
              {experiences.slice(0, 5).map((exp, index) => (
                <Link
                  key={exp.id}
                  href={`/experiences/${exp.slug || exp.id}`}
                  className="block p-6 flex items-center gap-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all border-b border-slate-50 dark:border-slate-800/50 last:border-0 group cursor-pointer"
                >
                  {/* Number Index */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl font-black text-slate-200 dark:text-slate-700 group-hover:text-blue-200 dark:group-hover:text-blue-500/50 transition-colors italic">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-4">
                      {exp.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 dark:border dark:border-blue-500/20">
                          {exp.author?.name?.slice(0, 1) || '匿'}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-400">{exp.author?.name || '匿名'}</span>
                      </div>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                      <span className="text-slate-500 dark:text-slate-600 truncate">
                        {exp.company?.name && `${exp.company.name} | `}
                        {exp.jobTitle || '求职经验'}
                      </span>
                      <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full hidden sm:block"></span>
                      <span className="hidden sm:flex items-center gap-1 text-slate-400 dark:text-slate-600 text-xs">
                        <Eye className="w-3 h-3" /> {exp.viewCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 self-center">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-600 transition-all text-slate-300 dark:text-slate-600 group-hover:text-white dark:border dark:border-slate-700 dark:group-hover:border-blue-500">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {experiences.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                暂无经验分享
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Floating Feedback Widget */}
      <div className="fixed bottom-8 right-8 z-50 group">
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
          <div className="bg-slate-900 dark:bg-slate-800 text-white text-sm py-2 px-4 rounded-xl shadow-xl whitespace-nowrap relative dark:border dark:border-slate-700">
            有建议或问题？告诉我吧
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 dark:bg-slate-800 dark:border-r dark:border-b dark:border-slate-700 transform rotate-45"></div>
          </div>
        </div>

        {/* Button */}
        <button className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-gradient-to-br dark:from-blue-600 dark:to-blue-500 text-blue-600 dark:text-white shadow-xl shadow-slate-200 dark:shadow-blue-600/30 border border-slate-100 dark:border-blue-400/20 hover:scale-110 hover:shadow-2xl dark:hover:shadow-blue-500/50 hover:border-blue-100 transition-all duration-300 z-50">
          <MessageSquarePlus className="w-7 h-7 dark:w-6 dark:h-6" />
        </button>
      </div>

    </div>
  )
}
