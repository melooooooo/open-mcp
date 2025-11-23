"use client"

import { useState, useEffect, useTransition } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Search, Loader2, X } from "lucide-react"
import { getJobListings, getFilterOptions, type JobListing, COMPANY_TYPES, INDUSTRY_CATEGORIES, SESSION_OPTIONS } from "@/lib/api/job-listings"
import { JobItem } from "./job-item"
import { useDebounce } from "@/hooks/use-debounce"
import { Container } from "@/components/web/container"

export function JobList() {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [industry, setIndustry] = useState("all")
  const [companyType, setCompanyType] = useState("all")
  const [session, setSession] = useState("all")

  // Options
  // Industry and Company Type options are now static constants, but we can still keep them in state if we want to load them async later
  // For now, using the imported constants directly is fine, but let's stick to the pattern of loading options
  const [industryOptions, setIndustryOptions] = useState<string[]>(INDUSTRY_CATEGORIES)
  const [companyTypeOptions, setCompanyTypeOptions] = useState<string[]>(COMPANY_TYPES)
  const [sessionOptions, setSessionOptions] = useState<string[]>(SESSION_OPTIONS)

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 20

  const debouncedQuery = useDebounce(query, 500)
  const debouncedLocation = useDebounce(location, 500)
  const [isPending, startTransition] = useTransition()

  // Load options on mount
  useEffect(() => {
    getFilterOptions().then(opts => {
      // All options are now static constants, so we don't strictly need this async call anymore
      // but keeping it for consistency if we ever revert to dynamic loading
      setSessionOptions(opts.sessions)
    })
  }, [])

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const res = await getJobListings({
        page,
        pageSize,
        query: debouncedQuery,
        location: debouncedLocation,
        industry: industry === "all" ? undefined : industry,
        companyType: companyType === "all" ? undefined : companyType,
        session: session === "all" ? undefined : session,
      })

      setJobs(res.data)
      setTotal(res.count)
      setLoading(false)
    }

    startTransition(() => {
      fetchData()
    })
  }, [page, debouncedQuery, debouncedLocation, industry, companyType, session])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, debouncedLocation, industry, companyType, session])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <Container className="py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
            <Input
              placeholder="搜索职位、公司..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="w-[140px] shrink-0">
              <Input
                placeholder="工作地点"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <Select value={companyType} onValueChange={setCompanyType}>
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue placeholder="企业性质" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有性质</SelectItem>
                {companyTypeOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue placeholder="行业分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有行业</SelectItem>
                {industryOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={session} onValueChange={setSession}>
              <SelectTrigger className="w-[120px] shrink-0">
                <SelectValue placeholder="届次" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有届次</SelectItem>
                {sessionOptions.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>共找到 {total} 个职位</span>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[140px] rounded-xl border bg-muted/10 animate-pulse" />
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="flex flex-col gap-4">
          {jobs.map(job => (
            <JobItem key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p>没有找到相关职位</p>
          <Button variant="link" onClick={() => {
            setQuery("")
            setLocation("")
            setIndustry("all")
            setCompanyType("all")
            setSession("all")
          }}>
            清除筛选条件
          </Button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          >
            上一页
          </Button>
          <div className="flex items-center px-4 text-sm">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          >
            下一页
          </Button>
        </div>
      )}
    </Container>
  )
}
