"use client"

import { Container } from "@/components/web/container"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Button } from "@repo/ui/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { useSession } from "@/hooks/auth-hooks"
import { MapPin, Link as LinkIcon, Github, Twitter, Calendar, MessageSquare, ThumbsUp } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function UserProfileContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "posts"

  const user = session?.user || {
    name: "用户",
    email: "user@example.com",
    image: "",
    id: "unknown"
  }

  // Mock data for feed
  const posts = [
    {
      id: 1,
      title: "失业么工资，副业又没收入，房贷吞噬储蓄，房子降价卖了很久卖不掉，月供撑一年困难。",
      summary: "最近的经济形势确实不容乐观，很多人都面临着相似的困境...",
      author: user.name,
      time: "4小时前",
      likes: 0,
      comments: 0
    },
    {
      id: 2,
      title: "发小红书的宣传贴虽然观看少，但意外的有两人加过来了...",
      summary: "其中一个还是主播说愿意无偿帮我翻译，我的翻译...",
      author: user.name,
      time: "5天前",
      likes: 0,
      comments: 0
    },
    {
      id: 3,
      title: "今天把自己小产品发布到小红书了，收获了第一个赞。",
      summary: "虽然只是一个小小的开始，但是感觉非常有成就感...",
      author: user.name,
      time: "11-14",
      likes: 5,
      comments: 0
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <Container className="py-10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
              <AvatarImage src={user.image || ""} alt={user.name || ""} />
              <AvatarFallback className="text-2xl">{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-sm text-muted-foreground mt-1">星球编号: {user.id.slice(0, 8)}</p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  关注
                </Button>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="wave">👋</span>
                  <span>【我是谁】 {user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span role="img" aria-label="city">🏙️</span>
                  <span>【所在城市】 深圳 (ps: 老家海南海口) ...</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-gray-600">
                  <span className="text-blue-400">♂</span>
                  <span>海南省/海口市/琼山区</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
                <span><strong className="text-gray-900">0</strong> 关注</span>
                <span><strong className="text-gray-900">0</strong> 粉丝</span>
                <span><strong className="text-gray-900">27</strong> 获赞与点赞</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Content Section */}
      <Container className="py-6">
        <div className="bg-white rounded-xl shadow-sm border min-h-[500px]">
          <Tabs defaultValue={currentTab} className="w-full">
            <div className="border-b px-6 py-2 flex items-center justify-between">
              <TabsList className="bg-transparent h-auto p-0 space-x-6">
                <TabsTrigger
                  value="posts"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-3 text-base font-medium text-gray-500 hover:text-gray-700 transition-all"
                >
                  帖子
                </TabsTrigger>
                <TabsTrigger
                  value="collections"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-3 text-base font-medium text-gray-500 hover:text-gray-700 transition-all"
                >
                  收藏
                </TabsTrigger>
                <TabsTrigger
                  value="likes"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-3 text-base font-medium text-gray-500 hover:text-gray-700 transition-all"
                >
                  点赞
                </TabsTrigger>
                <TabsTrigger
                  value="logs"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-3 text-base font-medium text-gray-500 hover:text-gray-700 transition-all"
                >
                  日志
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="posts" className="mt-0 space-y-6">
                {posts.map(post => (
                  <div key={post.id} className="group pb-6 border-b last:border-0">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-emerald-600 transition-colors cursor-pointer mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {post.summary}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="text-emerald-600">{post.author}</span>
                      <span>{post.time}</span>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="collections" className="mt-0">
                <div className="text-center py-20 text-muted-foreground">
                  暂无收藏内容
                </div>
              </TabsContent>

              <TabsContent value="likes" className="mt-0">
                <div className="text-center py-20 text-muted-foreground">
                  暂无点赞内容
                </div>
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <div className="text-center py-20 text-muted-foreground">
                  暂无日志内容
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Container>
    </div>
  )
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfileContent />
    </Suspense>
  )
}
