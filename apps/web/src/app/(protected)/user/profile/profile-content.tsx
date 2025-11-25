"use client"

import { Container } from "@/components/web/container"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Button } from "@repo/ui/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import { MapPin, Phone, User, Bookmark, Heart, Calendar } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { EditProfileDialog } from "./edit-profile-dialog"

export function UserProfileContent({ user }: { user: any }) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "collections"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="h-48 bg-gradient-to-r from-emerald-600 to-teal-600 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </div>

      <Container className="relative -mt-20 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6 relative overflow-hidden">
              <div className="relative z-10 flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 border-4 border-white shadow-md mb-4">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="text-4xl bg-emerald-50 text-emerald-600">
                    {user.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h1>
                <p className="text-sm text-gray-500 mb-6 font-mono">ID: {user.id.slice(0, 8)}</p>

                <div className="flex gap-3 w-full mb-8">
                  <div className="flex-1">
                    <EditProfileDialog user={user} />
                  </div>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                    关注
                  </Button>
                </div>

                <div className="w-full space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4" /> 性别
                    </span>
                    <span className="font-medium text-gray-900">
                      {user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '保密'}
                    </span>
                  </div>

                  {user.address && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> 城市
                      </span>
                      <span className="font-medium text-gray-900 truncate max-w-[150px]" title={user.address}>
                        {user.address}
                      </span>
                    </div>
                  )}

                  {user.contactPhone && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> 电话
                      </span>
                      <span className="font-medium text-gray-900">
                        {user.contactPhone}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> 加入时间
                    </span>
                    <span className="font-medium text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="grid grid-cols-3 gap-4 text-center divide-x">
                <div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-500 mt-1">关注</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-500 mt-1">粉丝</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">27</div>
                  <div className="text-xs text-gray-500 mt-1">获赞</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Tabs */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border min-h-[600px] flex flex-col">
              <Tabs defaultValue={currentTab} className="w-full flex-1 flex flex-col">
                <div className="border-b px-6">
                  <TabsList className="bg-transparent h-auto p-0 space-x-8 w-full justify-start">
                    <TabsTrigger
                      value="collections"
                      className="group data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-4 text-base font-medium text-gray-500 hover:text-gray-700 transition-all flex items-center gap-2"
                    >
                      <Bookmark className="w-4 h-4 group-data-[state=active]:fill-current" />
                      我的收藏
                    </TabsTrigger>
                    <TabsTrigger
                      value="likes"
                      className="group data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 rounded-none px-0 py-4 text-base font-medium text-gray-500 hover:text-gray-700 transition-all flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4 group-data-[state=active]:fill-current" />
                      我的点赞
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 flex-1 bg-gray-50/30">
                  <TabsContent value="collections" className="mt-0 h-full">
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Bookmark className="w-8 h-8 text-gray-300" />
                      </div>
                      <p>暂无收藏内容</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="likes" className="mt-0 h-full">
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Heart className="w-8 h-8 text-gray-300" />
                      </div>
                      <p>暂无点赞内容</p>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
