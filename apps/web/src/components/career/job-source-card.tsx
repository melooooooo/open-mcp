"use client"

import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Badge } from "@repo/ui/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { ExternalLink } from "lucide-react"
import { cn } from "@repo/ui/lib/utils"

export interface JobSource {
  id: string
  name: string
  logo?: string
  description: string
  url: string
  tags: string[]
  updatesToday?: number
  totalItems?: number
  source?: string
}

interface JobSourceCardProps {
  source: JobSource
  className?: string
}

export function JobSourceCard({ source, className }: JobSourceCardProps) {
  return (
    <a href={source.url} target="_blank" rel="noreferrer" className="block">
      <Card
        className={cn(
          "h-full hover:shadow-lg transition-all border-primary/20 hover:border-primary/40",
          "rounded-2xl",
          className
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={source.logo} alt={source.name} />
              <AvatarFallback className="text-xs">{source.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base truncate">{source.name}</h3>
                    {source.updatesToday && source.updatesToday > 0 && (
                      <Badge className="bg-emerald-500 text-white border-0 h-5">今日{source.updatesToday}条</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {source.description}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
              {source.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {source.tags.slice(0, 4).map((t) => (
                    <Badge key={t} variant="outline" className="text-[11px] rounded-full">
                      {t}
                    </Badge>
                  ))}
                  {source.totalItems ? (
                    <Badge variant="secondary" className="text-[11px] rounded-full">
                      {source.totalItems} 职位
                    </Badge>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

