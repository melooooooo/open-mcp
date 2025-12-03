"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { Briefcase, FileText, Globe, Inbox } from "lucide-react";

interface ComprehensiveSearchResultsProps {
  data: {
    jobListings: any[];
    experiences: any[];
    jobSites: any[];
  };
}

export function ComprehensiveSearchResults({ data }: ComprehensiveSearchResultsProps) {
  const { jobListings, experiences, jobSites } = data;

  return (
    <div className="space-y-12">
      {/* Job Listings */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          招聘信息
          <Badge variant="secondary" className="ml-2">{jobListings.length}</Badge>
        </h2>
        {jobListings.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobListings.map((job) => (
              <Card key={job.id} className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{job.jobTitle}</CardTitle>
                  <CardDescription>{job.companyName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.workLocation && (
                      <>
                        {job.workLocation.split(/[,，]/).slice(0, 3).map((loc: string, index: number) => (
                          <Badge key={index} variant="outline" className="max-w-[100px] truncate" title={loc}>
                            {loc.trim()}
                          </Badge>
                        ))}
                        {job.workLocation.split(/[,，]/).length > 3 && (
                          <Badge variant="outline" className="text-muted-foreground">
                            +{job.workLocation.split(/[,，]/).length - 3}
                          </Badge>
                        )}
                      </>
                    )}
                    {job.companyType && <Badge variant="secondary">{job.companyType}</Badge>}
                  </div>
                  {job.sourceUpdatedAt && (
                    <p className="text-xs text-muted-foreground">
                      更新于 {job.sourceUpdatedAt}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">暂无相关招聘信息</p>
          </div>
        )}
      </section>

      {/* Experiences */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          经验分享
          <Badge variant="secondary" className="ml-2">{experiences.length}</Badge>
        </h2>
        {experiences.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {experiences.map((exp) => (
              <Link key={exp.id} href={`/experiences/${exp.slug}`} className="block h-full">
                <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 h-full cursor-pointer group">
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">{exp.title}</CardTitle>
                    {exp.organizationName && (
                      <CardDescription>{exp.organizationName}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {exp.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                      <span>{exp.viewCount || 0} 阅读</span>
                      <span>{exp.likeCount || 0} 点赞</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">暂无相关经验分享</p>
          </div>
        )}
      </section>

      {/* Job Sites */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          求职导航
          <Badge variant="secondary" className="ml-2">{jobSites.length}</Badge>
        </h2>
        {jobSites.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobSites.map((site) => (
              <Card key={site.id} className="hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">{site.title}</CardTitle>
                  {site.companyName && (
                    <CardDescription>{site.companyName}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {site.location && <Badge variant="outline">{site.location}</Badge>}
                    {site.description && <Badge variant="secondary">{site.description}</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                    {site.publishDate && <span>{site.publishDate}</span>}
                    {site.replyCount !== undefined && <span>{site.replyCount} 回复</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
            <Inbox className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">暂无相关求职导航</p>
          </div>
        )}
      </section>
    </div>
  );
}
