"use client";

import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import { Button } from "@repo/ui/components/ui/button";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { SearchBar } from "@/components/search-bar";
import { ComprehensiveSearchResults } from "@/components/web/comprehensive-search-results";
import { Container } from "@/components/web/container";
import { trpc } from "@/lib/trpc/client";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";

  // 使用tRPC进行搜索查询
  const {
    data: searchResults,
    isLoading,
    error,
    refetch,
  } = trpc.mcpSearch.searchAll.useQuery(
    {
      query,
    },
    {
      // 禁用自动重新获取，因为这是基于用户输入的搜索
      enabled: query.length > 0,
      // 不缓存搜索结果
      staleTime: 0,
    }
  );

  const hasResults = searchResults && (
    searchResults.jobListings.length > 0 ||
    searchResults.experiences.length > 0 ||
    searchResults.jobSites.length > 0
  );

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold mb-6">搜索结果</h1>

      <div className="mb-8">
        <SearchBar defaultValue={query} />
      </div>

      <div className="space-y-2 mb-6">
        <p className="text-muted-foreground">
          {query ? `搜索 "${query}" 的结果` : "所有结果"}
        </p>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="space-y-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-[200px] rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>搜索失败</AlertTitle>
          <AlertDescription>
            <p className="mb-2">搜索时出错。请稍后再试。</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              重试
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 空结果状态 */}
      {!isLoading && !error && searchResults && !hasResults && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">没有找到相关结果</h3>
          <p className="text-muted-foreground mt-2">尝试使用不同的关键词或浏览分类</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
            返回首页
          </Button>
        </div>
      )}

      {/* 结果列表 */}
      {!isLoading && !error && searchResults && hasResults && (
        <ComprehensiveSearchResults data={searchResults} />
      )}
    </Container>
  );
}
