"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/ui/alert-dialog"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu"
import { Input } from "@repo/ui/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table"
import { ExternalLink, Megaphone, MoreHorizontal, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminTablePagination } from "@/components/admin/admin-table-pagination"
import { trpc } from "@/lib/trpc/client"

export default function AdminReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const {
    data: searchResult,
    isLoading,
    error,
    refetch,
  } = trpc.referrals.search.useQuery({
    query: searchQuery,
    page: currentPage,
    limit: itemsPerPage,
  })

  const { mutate: deleteReferral } = trpc.referrals.delete.useMutation({
    onSuccess: () => {
      toast.success("内推文章已删除")
      refetch()
    },
    onError: (err) => {
      toast.error("删除失败", { description: err.message })
    },
  })

  const handleDelete = (id: string) => {
    deleteReferral({ id })
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium">加载失败</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  const pagination = searchResult?.pagination
  const showingFrom = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
  const showingTo = pagination
    ? Math.min(pagination.page * pagination.limit, pagination.total)
    : 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="内推管理"
        description="管理内推广场的文章，删除后爬虫同步可能重新写入"
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索标题、公司或作者..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>公司</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead>回复数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7} className="h-16">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </TableCell>
                </TableRow>
              ))
            ) : searchResult?.data.length ? (
              searchResult.data.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="max-w-[280px] font-medium">
                    <span className="line-clamp-2" title={job.title}>
                      {job.title}
                    </span>
                  </TableCell>
                  <TableCell>{job.companyName || "—"}</TableCell>
                  <TableCell>{job.author || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.source || "unknown"}</Badge>
                  </TableCell>
                  <TableCell>{job.publishDate || "—"}</TableCell>
                  <TableCell>{job.replyCount ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">打开菜单</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        {job.link && (
                          <DropdownMenuItem asChild>
                            <a href={job.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              查看原文
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="cursor-pointer text-destructive focus:text-destructive"
                            >
                              删除文章
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除内推文章？</AlertDialogTitle>
                              <AlertDialogDescription>
                                将永久删除「{job.title}」。若爬虫仍在同步该帖子，下次同步可能重新写入。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(job.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                确认删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center">
                  <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">没有找到内推文章</h3>
                  <p className="mt-1 text-sm text-muted-foreground">尝试调整搜索条件。</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <AdminTablePagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          showingFrom={showingFrom}
          showingTo={showingTo}
        />
      )}
    </div>
  )
}
