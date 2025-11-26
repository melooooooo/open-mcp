"use client"

import { Container } from "@/components/web/container"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Button } from "@repo/ui/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { MapPin, Phone, User, Bookmark, Heart, Calendar, Building2, FileText, Clock, Eye, Sparkles, Briefcase } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { EditProfileDialog } from "./edit-profile-dialog"
import { toggleCollection, toggleJobListingCollection, toggleExperienceLike } from "./actions"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { cn } from "@repo/ui/lib/utils"

export function UserProfileContent({
  user,
  collectedJobs = [],
  collectedJobListings = [],
  likedExperiences = []
}: {
  user: any,
  collectedJobs?: any[],
  collectedJobListings?: any[],
  likedExperiences?: any[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const currentTab = searchParams.get("tab") || "collections"

  // Helper to process job data for display
  const processJob = (job: any, context: 'collection' | 'like') => {
    // Try to extract info from title if fields are empty
    let company = job.companyName || "未知公司"
    let location = job.location || "未知地点"
    let salary = job.salary || "薪资面议"
    let type = "job"

    const match = job.title.match(/【(.*?)】【(.*?)】(.*)/);
    if (match) {
      if (!job.companyName) company = match[2];
    }

    // Determine timestamp to show
    let timeLabel = ""
    let timestamp = null
    if (context === 'collection') {
      timeLabel = "收藏于"
      timestamp = job.collectedAt
    } else {
      timeLabel = "点赞于"
      timestamp = job.likedAt
    }

    // Format relative time or date
    const timeStr = timestamp ? new Date(timestamp).toLocaleDateString() : ""

    return {
      id: job.id,
      type: type,
      title: job.title,
      company,
      location,
      salary,
      timeLabel,
      time: timeStr,
      iconColor: "bg-blue-50 text-blue-600",
      icon: Briefcase,
      author: job.author,
      tag: "招聘",
      views: 0,
      likes: 0,
      isLiked: job.isLiked,
      isCollected: job.isCollected
    }
  }

  // Process job listings (Recruitment)
  const processJobListing = (job: any) => {
    const timestamp = job.collectedAt
    const timeStr = timestamp ? new Date(timestamp).toLocaleDateString() : ""

    return {
      id: job.id,
      type: 'recruitment',
      title: `${job.jobTitle} - ${job.companyName}`,
      company: job.companyName,
      location: job.workLocation,
      salary: "薪资面议",
      timeLabel: "收藏于",
      time: timeStr,
      iconColor: "bg-green-50 text-green-600",
      icon: Briefcase,
      tag: "校招",
      session: job.session,
      degree: job.degreeRequirement,
      author: "",
      views: 0,
      likes: 0,
      isLiked: false,
      isCollected: true
    }
  }

  // Process liked experiences
  const processExperience = (exp: any) => {
    const timestamp = exp.likedAt
    const timeStr = timestamp ? new Date(timestamp).toLocaleDateString() : ""

    return {
      id: exp.id,
      type: 'experience',
      title: exp.title,
      company: exp.organizationName || "未知公司",
      location: "",
      salary: "",
      timeLabel: "点赞于",
      time: timeStr,
      iconColor: "bg-purple-50 text-purple-600",
      icon: FileText,
      tag: exp.articleType === 'interview' ? '面经' : exp.articleType === 'guide' ? '攻略' : '点评',
      slug: exp.slug,
      tags: exp.tags,
      summary: exp.summary,
      author: exp.authorName || "",
      views: 0,
      likes: exp.likeCount || 0,
      isLiked: true,
      isCollected: false
    }
  }

  const displayCollected = [
    ...collectedJobs.map(j => processJob(j, 'collection')),
    ...collectedJobListings.map(processJobListing)
  ].sort((a, b) => {
    const timeA = a.time ? new Date(a.time).getTime() : 0
    const timeB = b.time ? new Date(b.time).getTime() : 0
    return timeB - timeA
  })

  const displayLiked = likedExperiences.map(processExperience).sort((a, b) => {
    const timeA = a.time ? new Date(a.time).getTime() : 0
    const timeB = b.time ? new Date(b.time).getTime() : 0
    return timeB - timeA
  })

  const handleCollectScrapedJob = async (e: React.MouseEvent, jobId: string) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      await toggleCollection(jobId)
    })
  }

  const handleCollectJobListing = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      await toggleJobListingCollection(listingId)
    })
  }

  const handleLikeExperience = async (e: React.MouseEvent, experienceId: string) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      await toggleExperienceLike(experienceId)
    })
  }

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans">
      {/* Banner Section */}
      <div className="h-48 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-[-50%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      <Container className="relative -mt-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-lg ring-1 ring-slate-100">
                    <AvatarImage src={user.image || ""} alt={user.name || ""} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-blue-50 text-blue-600 font-bold">
                      {user.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-1 right-1 bg-blue-500 w-4 h-4 rounded-full border-2 border-white" title="在线"></div>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h1>
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono rounded-full border border-slate-200">
                    ID: {user.id.slice(0, 8)}
                  </span>
                </div>

                <div className="w-full mb-8">
                  <EditProfileDialog user={user} />
                </div>

                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between text-sm group/item p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-slate-500 flex items-center gap-3 text-xs font-medium">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      性别
                    </span>
                    <span className="font-semibold text-slate-700 text-xs">
                      {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '保密'}
                    </span>
                  </div>

                  {user.address && (
                    <div className="flex items-center justify-between text-sm group/item p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="text-slate-500 flex items-center gap-3 text-xs font-medium">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        城市
                      </span>
                      <span className="font-semibold text-slate-700 truncate max-w-[150px] text-xs" title={user.address}>
                        {user.address}
                      </span>
                    </div>
                  )}

                  {user.contactPhone && (
                    <div className="flex items-center justify-between text-sm group/item p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="text-slate-500 flex items-center gap-3 text-xs font-medium">
                        <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                        电话
                      </span>
                      <span className="font-semibold text-slate-700 text-xs">
                        {user.contactPhone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm group/item p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-slate-500 flex items-center gap-3 text-xs font-medium">
                      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      加入时间
                    </span>
                    <span className="font-semibold text-slate-700 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-100 p-6">
              <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100">
                <div className="group cursor-pointer">
                  <div className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">0</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mt-1">关注</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">0</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mt-1">粉丝</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">27</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400 font-medium mt-1">获赞</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Tabs */}
          <div className="lg:col-span-8">
            <Tabs defaultValue={currentTab} className="w-full space-y-8">
              {/* Floating Tabs Header */}
              <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-full inline-flex border border-white/50 shadow-sm">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                  <TabsTrigger
                    value="collections"
                    className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-100 text-slate-500 hover:text-slate-700 flex items-center gap-2"
                  >
                    <Bookmark className="w-4 h-4" />
                    我的收藏
                    <span className="ml-1.5 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-[10px] font-bold min-w-[20px] text-center">
                      {displayCollected.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="likes"
                    className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-100 text-slate-500 hover:text-slate-700 flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    我的点赞
                    <span className="ml-1.5 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-[10px] font-bold min-w-[20px] text-center">
                      {displayLiked.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-slate-100 text-slate-500 hover:text-slate-700 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    浏览历史
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Content Area */}
              <TabsContent value="collections" className="mt-0 space-y-4 focus-visible:ring-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                {displayCollected.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-4">
                      <Bookmark className="w-8 h-8" />
                    </div>
                    <h3 className="text-slate-900 font-semibold mb-1">暂无收藏内容</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">您收藏的职位或文章将会显示在这里，方便您随时查看。</p>
                    <Button variant="outline" className="mt-6 rounded-full" onClick={() => router.push('/jobs')}>
                      去逛逛职位
                    </Button>
                  </div>
                ) : (
                  displayCollected.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden">
                      <div className="flex items-start gap-5 relative z-10">
                        {/* Icon */}
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 border border-white/50",
                          item.iconColor
                        )}>
                          <item.icon className="w-7 h-7" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate pr-8 leading-tight">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400 flex-shrink-0">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                <Clock className="w-3 h-3" />
                                {item.timeLabel} {item.time}
                              </span>
                              <button
                                onClick={(e) => {
                                  if (item.type === 'job') {
                                    handleCollectScrapedJob(e, item.id)
                                  } else if (item.type === 'recruitment') {
                                    handleCollectJobListing(e, item.id)
                                  }
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 hover:bg-blue-50 text-blue-600 bg-blue-50/70"
                                title="取消收藏"
                              >
                                <Bookmark className="w-4 h-4 fill-current" />
                              </button>
                            </div>
                          </div>

                          {/* Meta Info */}
                          {item.type === 'job' ? (
                            <div className="flex items-center flex-wrap gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                                {item.company}
                              </span>
                              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {item.location}
                              </span>
                              <span className="flex items-center gap-1.5 font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {item.salary}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center flex-wrap gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {item.author}
                              </span>
                              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                                {item.tag}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="likes" className="mt-0 space-y-4 focus-visible:ring-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                {displayLiked.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mb-4">
                      <Heart className="w-8 h-8" />
                    </div>
                    <h3 className="text-slate-900 font-semibold mb-1">暂无点赞内容</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">遇到喜欢的内容不要吝啬您的赞美，点赞后将在此处显示。</p>
                    <Button variant="outline" className="mt-6 rounded-full" onClick={() => router.push('/experiences')}>
                      去看看经验分享
                    </Button>
                  </div>
                ) : (
                  displayLiked.map((item) => (
                    <div key={`like-${item.id}`} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden">
                      <div className="flex items-start gap-5 relative z-10">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 border border-white/50",
                          item.iconColor
                        )}>
                          <item.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate pr-8 leading-tight">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400 flex-shrink-0">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                <Clock className="w-3 h-3" />
                                {item.timeLabel} {item.time}
                              </span>
                              <button
                                onClick={(e) => handleLikeExperience(e, item.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90 hover:bg-blue-50 text-blue-600 bg-blue-50/70"
                                title="取消点赞"
                              >
                                <Heart className="w-4 h-4 fill-current scale-110" />
                              </button>
                            </div>
                          </div>
                          {item.type === 'job' ? (
                            <div className="flex items-center flex-wrap gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 group-hover:border-blue-100 group-hover:bg-blue-50/30 transition-colors">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
                                {item.company}
                              </span>
                              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {item.location}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center flex-wrap gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {item.author}
                              </span>
                              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                                {item.tag}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="history" className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8" />
                  </div>
                  <h3 className="text-slate-900 font-semibold mb-1">暂无浏览历史</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">您的浏览足迹将会保留在这里，支持最近30天的记录回溯。</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </Container>
    </div>
  )
}
