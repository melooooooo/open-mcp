"use client"

import { ArrowRight, BookOpen, TrendingUp } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { ExperienceCard } from "./experience-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import Link from "next/link"

interface ExperienceSectionProps {
  experiences: any[]
  showViewAll?: boolean
}

export function ExperienceSection({ experiences, showViewAll = true }: ExperienceSectionProps) {
  // 按类型分组经验
  const interviews = experiences.filter(exp => exp.type === "interview")
  const guides = experiences.filter(exp => exp.type === "guide")
  const reviews = experiences.filter(exp => exp.type === "review")

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        {/* 标题区域 */}
        <div className="mb-8 text-center">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
            <BookOpen className="mr-1 h-3 w-3" />
            经验分享
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            前辈经验，助你少走弯路
          </h2>
          <p className="mt-2 text-muted-foreground">
            真实的面试经历、求职攻略和职场心得，帮你提升求职成功率
          </p>
        </div>

        {/* 选项卡切换 */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 mb-8">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="interview">面经</TabsTrigger>
            <TabsTrigger value="guide">攻略</TabsTrigger>
            <TabsTrigger value="review">点评</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {experiences.slice(0, 6).map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onClick={() => console.log(`Navigate to experience ${experience.id}`)}
                  onLike={() => console.log(`Like experience ${experience.id}`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {interviews.slice(0, 6).map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onClick={() => console.log(`Navigate to experience ${experience.id}`)}
                  onLike={() => console.log(`Like experience ${experience.id}`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {guides.slice(0, 6).map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onClick={() => console.log(`Navigate to experience ${experience.id}`)}
                  onLike={() => console.log(`Like experience ${experience.id}`)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((experience) => (
                <ExperienceCard
                  key={experience.id}
                  experience={experience}
                  onClick={() => console.log(`Navigate to experience ${experience.id}`)}
                  onLike={() => console.log(`Like experience ${experience.id}`)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 底部操作 */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {showViewAll && (
            <Button variant="outline" size="lg" asChild>
              <Link href="/experiences">
                浏览更多经验
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <TrendingUp className="mr-2 h-4 w-4" />
            分享你的经验
          </Button>
        </div>
      </div>
    </section>
  )
}