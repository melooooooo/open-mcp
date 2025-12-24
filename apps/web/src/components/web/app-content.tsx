"use client";

import { MarkdownReadonly } from "@repo/ui/components/markdown/markdown-readonly";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Separator } from "@repo/ui/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { AlertCircle, ExternalLink, Eye, GitCommit, GitFork, Github, GitPullRequest, Info, Package, Star, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ClaimAppDialog } from "@/components/claim-app-dialog";
import { RecommendedApps } from "@/components/recommended-apps";
import { RelatedApps } from "@/components/related-apps";
import { SuggestionDialog } from "@/components/suggestion-dialog";
import { AppGitHubCard } from "@/components/web/app-github-card";
import { AppVersionDialog } from "@/components/web/app-release-dialog";
import { AppTagWithPopover } from "@/components/web/app-tag-popover";
import { Container } from "@/components/web/container";
import { PageHeader } from "@/components/web/page-header";
import { formatDate, formatNumber, getAssetUrl } from "@/lib/utils";

export function AppContent({ app }: { app: any }) {
  return (
    <Container className="px-4 md:px-6">
      <PageHeader title={app.name} backLink={{ href: `/category/${app.type}`, label: "返回应用列表" }}>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant={app.type === "client" ? "default" : app.type === "server" ? "secondary" : "outline"}>
            {app.type === "client" ? "客户端" : app.type === "server" ? "服务器" : "应用"}
          </Badge>
          {app.tags && app.tags?.slice(0, 5).map((tag: any) =>
            tag && (
              <Link key={tag.id} href={`/tag/${encodeURIComponent(tag.name)}`}>
                <AppTagWithPopover tag={tag.name} />
              </Link>
            )
          )}
        </div>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="flex items-start gap-4 mb-6">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              {app.icon ? (
                <Image src={getAssetUrl(app.icon)} alt={app.name} width={64} height={64} className="object-cover" />
              ) : (
                <div className="text-2xl font-bold">{app.name.charAt(0)}</div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground">{app.descriptionZh || app.description}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {app?.website && <Button asChild>
              <Link href={app.website || "#"} target="_blank" rel="noopener noreferrer">
                访问官网
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>}
            <ClaimAppDialog app={app} />
            <SuggestionDialog app={app} />
          </div>

          <AppGitHubCard project={app} />
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-medium">应用信息</h3>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">类型</span>
                  <span>{app.type === "client" ? "客户端" : app.type === "server" ? "服务器" : "应用"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最新版本</span>
                  <span className="flex items-center">
                    {app.repoId ? (
                      <AppVersionDialog repoId={app.repoId} appName={app.name}>
                        <span className="flex items-center hover:text-primary transition-colors">
                          {app.version || "N/A"}
                          <Info className="h-4 w-4 ml-2" />
                        </span>
                      </AppVersionDialog>
                    ) : (
                      <span className="flex items-center">
                        {app.version || "N/A"}
                        <Info className="h-4 w-4 ml-2" />
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">创建日期</span>
                  <span>{app.repoCreatedAt ? formatDate(app.repoCreatedAt) : "未知"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">更新日期</span>
                  <span>{formatDate(app.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">许可证</span>
                  <span>{app.license || "N/A"}</span>
                </div>
              </div>
            </div>
          </div>

          {app?.github && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-medium">GitHub 统计</h3>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Stars
                    </span>
                    <span className="font-medium">{formatNumber(app.stars) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <GitFork className="h-4 w-4 mr-2" />
                      Forks
                    </span>
                    <span className="font-medium">{formatNumber(app.forks) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Watchers
                    </span>
                    <span className="font-medium">{formatNumber(app?.watchers) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Issues
                    </span>
                    <span className="font-medium">{formatNumber(app.issues) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      Pull Requests
                    </span>
                    <span className="font-medium">{formatNumber(app.pullRequests) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      贡献者
                    </span>
                    <span className="font-medium">{formatNumber(app.contributors) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      版本数
                    </span>
                    <span className="font-medium">{formatNumber(app.releases) || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center">
                      <GitCommit className="h-4 w-4 mr-2" />
                      最近提交
                    </span>
                    <span className="font-medium">{formatDate(app?.lastCommit)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                  <Link href={app.github} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    查看 GitHub
                  </Link>
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">相关应用</h3>
              <RelatedApps currentApp={app} />
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="readmeZh" className="mb-10 mt-10">
        <TabsList className="mb-4">
          <TabsTrigger value="readmeZh">中文文档</TabsTrigger>
          <TabsTrigger value="readme">原文</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <MarkdownReadonly>{app.longDescription ?? ""}</MarkdownReadonly>

            {app.type === "client" && (
              <>
                <h3>支持的服务器</h3>
                <ul>
                  {app.supportedServers?.map((server: string, index: number) => (
                    <li key={index}>{server}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <Separator />
          {app.features && app.features.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4">功能特性</h2>
              <div className="prose dark:prose-invert max-w-none">
                <ul className="list-disc pl-5 space-y-2">
                  {app.features?.map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="readme">
          <div className="container">
            <div className="prose dark:prose-invert max-w-none">
              <MarkdownReadonly>{app.readme ?? ""}</MarkdownReadonly>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="readmeZh">
          <div className="container">
            <div className="prose dark:prose-invert max-w-none">
              <MarkdownReadonly>{app.readmeZh ?? ""}</MarkdownReadonly>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <RecommendedApps currentApp={app} limit={6} />
    </Container>
  );
}
