import Link from "next/link"
import { Button } from "@repo/ui/components/ui/button"

interface ReferralPaginationProps {
  page: number
  totalPages: number
  totalCount: number
  pageSize: number
}

export function ReferralPagination({ page, totalPages, totalCount, pageSize }: ReferralPaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  const prevPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  const renderButton = (targetPage: number, label: string, disabled: boolean) => {
    if (disabled) {
      return (
        <Button variant="outline" size="sm" disabled>
          {label}
        </Button>
      )
    }

    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={`/referrals?page=${targetPage}`} scroll>
          {label}
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
      <div>
        共 {totalCount} 条 · 每页 {pageSize} 条 · 当前第 {page}/{totalPages} 页
      </div>
      <div className="flex gap-2">
        {renderButton(prevPage, "上一页", page === 1)}
        {renderButton(nextPage, "下一页", page >= totalPages)}
      </div>
    </div>
  )
}
