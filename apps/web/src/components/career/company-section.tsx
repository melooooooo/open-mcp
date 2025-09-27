"use client"

import { ArrowRight, Building2, Star } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { CompanyCard } from "./company-card"
import Link from "next/link"

interface CompanySectionProps {
  companies: any[]
  showViewAll?: boolean
}

export function CompanySection({ companies, showViewAll = true }: CompanySectionProps) {
  return (
    <section className="py-12">
      <div className="container">
        {/* 标题区域 */}
        <div className="mb-8 text-center">
          <Badge className="mb-4 bg-gradient-to-r from-green-600 to-teal-600 text-white border-0">
            <Building2 className="mr-1 h-3 w-3" />
            明星企业
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            优质企业，职业起点
          </h2>
          <p className="mt-2 text-muted-foreground">
            了解企业文化、福利待遇和发展前景，找到适合你的公司
          </p>
        </div>

        {/* 公司卡片网格 */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => console.log(`Navigate to company ${company.id}`)}
            />
          ))}
        </div>

        {/* 底部统计 */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <div className="text-2xl font-bold">2,456</div>
            <div className="text-sm text-muted-foreground">合作企业</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-green-600">92%</div>
            <div className="text-sm text-muted-foreground">大厂占比</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-blue-600">35k</div>
            <div className="text-sm text-muted-foreground">平均月薪</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-purple-600">4.5</div>
            <div className="text-sm text-muted-foreground">平均评分</div>
          </div>
        </div>

        {/* 查看更多 */}
        {showViewAll && (
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/companies">
                探索更多企业
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}