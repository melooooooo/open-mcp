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
import { BookOpen, ExternalLink, MoreHorizontal, Pencil, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminTablePagination } from "@/components/admin/admin-table-pagination"
import { trpc } from "@/lib/trpc/client"

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—"
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("zh-CN")
}

export default function AdminExperiencesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const {
    data: searchResult,
    isLoading,
    error,
    refetch,
  } = trpc.adminExperiences.search.useQuery({
    query: searchQuery,
    page: currentPage,
    limit: itemsPerPage,
  })

  const { mutate: deleteExperience } = trpc.adminExperiences.delete.useMutation({
    onSuccess: () => {
      toast.success("经验分享已删除")
      refetch()
    },
    onError: (err) => {
      toast.error("删除失败", { description: err.message })
    },
  })

  const handleDelete = (id: string) => {
    deleteExperience({ id })
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
        title="经验分享管理"
        description="管理经验分享广场的文章，可跳转到前台编辑页修改正文与封面"
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索标题、机构、作者或岗位..."
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
              <TableHead>机构</TableHead>
              <TableHead>作者</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>浏览/点赞</TableHead>
              <TableHead>发布时间</TableHead>
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
              searchResult.data.map((experience) => (
                <TableRow key={experience.id}>
                  <TableCell className="max-w-[280px] font-medium">
                    <span className="line-clamp-2" title={experience.title}>
                      {experience.title}
                    </span>
                    <div className="mt-1 flex gap-1">
                      {experience.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          置顶
                        </Badge>
                      )}
                      {experience.isHot && (
                        <Badge variant="destructive" className="text-xs">
                          热门
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{experience.organizationName || "—"}</TableCell>
                  <TableCell>{experience.authorName || "—"}</TableCell>
                  <TableCell>
                    {experience.articleType ? (
                      <Badge variant="outline">{experience.articleType}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {experience.viewCount ?? 0} / {experience.likeCount ?? 0}
                  </TableCell>
                  <TableCell>{formatDate(experience.publishTime)}</TableCell>
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
                        {experience.slug && (
                          <>
                            <DropdownMenuItem asChild>
                              <a
                                href={`/experiences/${experience.slug}/edit`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                编辑文章
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`/experiences/${experience.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                查看文章
                              </a>
                            </DropdownMenuItem>
                          </>
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
                              <AlertDialogTitle>确认删除经验分享？</AlertDialogTitle>
                              <AlertDialogDescription>
                                将永久删除「{experience.title}」，该操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(experience.id)}
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
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">没有找到经验分享</h3>
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
