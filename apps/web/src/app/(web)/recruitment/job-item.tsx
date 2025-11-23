import Link from "next/link"
import { Badge } from "@repo/ui/components/ui/badge"
import { MapPin, GraduationCap, Calendar, ExternalLink, Building2 } from "lucide-react"
import type { JobListing } from "@/lib/api/job-listings"
import { cn } from "@repo/ui/lib/utils"

interface JobItemProps {
  job: JobListing
}

export function JobItem({ job }: JobItemProps) {
  const isUrl = job.application_method.startsWith("http") || job.application_method.startsWith("www")
  const isEmail = job.application_method.includes("@")

  let applyLink = "#"
  if (isUrl) {
    applyLink = job.application_method.startsWith("http") ? job.application_method : `https://${job.application_method}`
  } else if (isEmail) {
    const emailMatch = job.application_method.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)
    if (emailMatch) {
      applyLink = `mailto:${emailMatch[0]}`
    }
  }

  return (
    <div className="group flex flex-col md:flex-row gap-4 p-6 bg-card hover:bg-muted/50 border rounded-xl transition-colors">
      {/* Main Content */}
      <div className="flex-1 space-y-3">
        {/* Header: Company & Date */}
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-bold text-primary">
            {job.company_name}
          </h3>
          <Badge variant="secondary" className="font-normal">
            {job.company_type}
          </Badge>
          <span className="text-sm text-muted-foreground flex items-center ml-auto md:ml-0">
            <Calendar className="w-3.5 h-3.5 mr-1" />
            {job.source_updated_at}
          </span>
        </div>

        {/* Job Title */}
        <div className="font-medium text-lg text-foreground/90">
          {job.job_title}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-y-2 gap-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
            <span>{job.work_location}</span>
          </div>
          <div className="flex items-center">
            <GraduationCap className="w-4 h-4 mr-1.5 shrink-0" />
            <span>{job.degree_requirement}</span>
          </div>
          <div className="flex items-center px-2 py-0.5 bg-muted rounded text-xs font-medium">
            {job.session}
          </div>
          {job.batch && (
            <div className="flex gap-2">
              {job.batch.split(/[,，、]/).map((tag, i) => (
                tag.trim() && (
                  <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                    {tag.trim()}
                  </span>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Button (Right side on desktop) */}
      <div className="flex md:flex-col justify-end md:justify-center shrink-0">
        {isUrl ? (
          <Link
            href={applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center h-10 px-6 rounded-lg font-medium transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            )}
          >
            立即投递 <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        ) : isEmail ? (
          <a
            href={applyLink}
            className={cn(
              "inline-flex items-center justify-center h-10 px-6 rounded-lg font-medium transition-colors",
              "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            发送邮件 <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        ) : (
          <div className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-muted text-muted-foreground cursor-not-allowed text-sm">
            {job.application_method.substring(0, 8)}...
          </div>
        )}
      </div>
    </div>
  )
}
