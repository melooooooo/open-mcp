"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@repo/ui/components/ui/button"

type Option = {
  label: string
  value: string
}

type FiltersProps = {
  initialTag?: string
  initialIndustry?: string
  industryOptions: Option[]
}

function buildQuery(tag: string, industry: string) {
  const params = new URLSearchParams()
  const trimmedTag = tag.trim()

  if (trimmedTag) params.set("tag", trimmedTag)
  if (industry) params.set("industry", industry)

  params.set("page", "1")

  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

function useFilterState(initialTag?: string, initialIndustry?: string) {
  const router = useRouter()
  const [tag, setTag] = useState(initialTag ?? "")
  const [industry, setIndustry] = useState(initialIndustry ?? "")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = buildQuery(tag, industry)
    startTransition(() => {
      router.replace(`/experiences${query}`)
    })
  }

  const handleReset = () => {
    startTransition(() => {
      setTag("")
      setIndustry("")
      router.replace("/experiences")
    })
  }

  return {
    tag,
    industry,
    setTag,
    setIndustry,
    isPending,
    hasFilters: Boolean(tag.trim() || industry),
    handleSubmit,
    handleReset,
  }
}

export function ExperienceFiltersDesktop({
  initialTag,
  initialIndustry,
  industryOptions,
}: FiltersProps) {
  const {
    tag,
    industry,
    setTag,
    setIndustry,
    isPending,
    hasFilters,
    handleSubmit,
    handleReset,
  } = useFilterState(initialTag, initialIndustry)

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="tag" className="text-sm font-medium text-muted-foreground">
          标签关键词
        </label>
        <input
          id="tag"
          name="tag"
          placeholder="如：薪资待遇"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="industry" className="text-sm font-medium text-muted-foreground">
          行业分类
        </label>
        <select
          id="industry"
          name="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          {industryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2 space-y-2">
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
          disabled={isPending}
        >
          {isPending ? "加载中..." : "应用筛选"}
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
            type="button"
            onClick={handleReset}
            disabled={isPending}
          >
            重置所有条件
          </Button>
        )}
      </div>
    </form>
  )
}

export function ExperienceFiltersMobile({
  initialTag,
  initialIndustry,
  industryOptions,
}: FiltersProps) {
  const {
    tag,
    industry,
    setTag,
    setIndustry,
    isPending,
    hasFilters,
    handleSubmit,
    handleReset,
  } = useFilterState(initialTag, initialIndustry)

  return (
    <form className="grid gap-4 sm:grid-cols-3" onSubmit={handleSubmit}>
      <input
        name="tag"
        placeholder="搜索标签..."
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <select
        name="industry"
        value={industry}
        onChange={(e) => setIndustry(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {industryOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isPending}>
          {isPending ? "加载中..." : "筛选"}
        </Button>
        {hasFilters && (
          <Button variant="outline" className="px-3" type="button" onClick={handleReset} disabled={isPending}>
            重置
          </Button>
        )}
      </div>
    </form>
  )
}
