import Link from "next/link"
import { Badge } from "@repo/ui/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@repo/ui/components/ui/card"
import { MapPin, Building2, GraduationCap, Calendar, ExternalLink } from "lucide-react"
import type { JobListing } from "@/lib/api/job-listings"
import { cn } from "@repo/ui/lib/utils"

interface JobCardProps {
  job: JobListing
}

export function JobCard({ job }: JobCardProps) {
  const isUrl = job.application_method.startsWith("http") || job.application_method.startsWith("www")
  const isEmail = job.application_method.includes("@")
  const titleText = job.job_title.length > 120 ? `${job.job_title.slice(0, 120)}…` : job.job_title

  let applyLink = "#"
  if (isUrl) {
    applyLink = job.application_method.startsWith("http") ? job.application_method : `https://${job.application_method}`
  } else if (isEmail) {
    // Extract email if mixed with text
    const emailMatch = job.application_method.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)
    if (emailMatch) {
      applyLink = `mailto:${emailMatch[0]}`
    }
  }

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow duration-200 border-border/50">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-2 leading-tight break-words" title={job.job_title}>
              {titleText}
            </h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              <span className="font-medium mr-2">{job.company_name}</span>
              <Badge variant="secondary" className="text-xs h-5 px-1.5 font-normal">
                {job.company_type}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0 whitespace-nowrap">
            {job.session}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 py-2 flex-1 space-y-3">
        <div className="flex flex-wrap gap-y-1 gap-x-3 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="line-clamp-1" title={job.work_location}>{job.work_location}</span>
          </div>
          <div className="flex items-center">
            <GraduationCap className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span className="line-clamp-1" title={job.degree_requirement}>{job.degree_requirement}</span>
          </div>
        </div>

        {job.batch && (
          <div className="flex flex-wrap gap-1">
            {job.batch.split(/[,，、]/).map((tag, i) => (
              tag.trim() && (
                <Badge key={i} variant="secondary" className="text-xs font-normal bg-muted/50 text-muted-foreground hover:bg-muted">
                  {tag.trim()}
                </Badge>
              )
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-2 border-t bg-muted/5 flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-1" />
          <span>{job.source_updated_at}</span>
        </div>

        {isUrl ? (
          <Link
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center font-medium transition-colors hover:text-primary",
              "text-primary/80"
            )}
          >
            立即投递 <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        ) : isEmail ? (
          <a
            href={applyLink}
            className="inline-flex items-center font-medium text-primary/80 hover:text-primary transition-colors"
          >
            发送邮件 <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        ) : (
          <span className="text-muted-foreground/70 cursor-not-allowed">
            {job.application_method.substring(0, 10)}...
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
