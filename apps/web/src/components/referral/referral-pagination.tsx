import Link from "next/link"
import { Button } from "@repo/ui/components/ui/button"

type PageItem = number | "ellipsis"

interface ReferralPaginationProps {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
}

function buildPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const items: PageItem[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)

  if (start > 2) items.push("ellipsis")
  for (let i = start; i <= end; i++) {
    items.push(i)
  }
  if (end < totalPages - 1) items.push("ellipsis")

  items.push(totalPages)
  return items
}

export function ReferralPagination({ page, totalPages, totalCount, pageSize }: ReferralPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const prevPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)
  const pageItems = buildPageItems(page, totalPages)

  const renderPageButton = (item: PageItem) => {
    if (item === "ellipsis") {
      return (
        <Button key={`ellipsis-${Math.random()}`} variant="ghost" size="sm" disabled className="px-2 text-slate-400">
          ...
        </Button>
      )
    }

    const isActive = item === page
    return (
      <Button key={item} variant={isActive ? "default" : "outline"} size="sm" asChild>
        <Link href={`/referrals?page=${item}`} scroll>
          {item}
        </Link>
      </Button>
    )
  }

  const renderNavButton = (targetPage: number, label: string, disabled: boolean) => (
    <Button variant="outline" size="sm" asChild={!disabled} disabled={disabled}>
      {disabled ? (
        <span>{label}</span>
      ) : (
        <Link href={`/referrals?page=${targetPage}`} scroll>
          {label}
        </Link>
      )}
    </Button>
  )

  return (
    <div className="flex flex-col items-center gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 text-center dark:border-slate-800 dark:text-slate-300">
      <div>
        共 {totalCount} 条 · 每页 {pageSize} 条 · 当前第 {page}/{totalPages} 页
      </div>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {renderNavButton(prevPage, "上一页", page === 1)}
        {pageItems.map(renderPageButton)}
        {renderNavButton(nextPage, "下一页", page >= totalPages)}
      </div>
    </div>
  )
}
