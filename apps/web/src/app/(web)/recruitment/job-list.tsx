"use client"

import { useState, useEffect } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Search, Loader2, X, ChevronDown } from "lucide-react"
import { getJobListings, getFilterOptions, type JobListing, COMPANY_TYPES, INDUSTRY_CATEGORIES, SESSION_OPTIONS } from "@/lib/api/job-listings"
import { JobItem } from "./job-item"
import { Container } from "@/components/web/container"
import { getJobCollectionStatus } from "@/app/actions/interactions"

export function JobList() {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [collectionStatus, setCollectionStatus] = useState<Record<string, boolean>>({})

  // Filters
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [industries, setIndustries] = useState<string[]>([])
  const [companyTypes, setCompanyTypes] = useState<string[]>([])
  const [session, setSession] = useState("all")

  // Applied filters (only fetch when用户点击“查询”)
  const [appliedQuery, setAppliedQuery] = useState("")
  const [appliedLocation, setAppliedLocation] = useState("")
  const [appliedIndustries, setAppliedIndustries] = useState<string[]>([])
  const [appliedCompanyTypes, setAppliedCompanyTypes] = useState<string[]>([])
  const [appliedSession, setAppliedSession] = useState("all")

  // Options
  // Industry and Company Type options are now static constants, but we can still keep them in state if we want to load them async later
  // For now, using the imported constants directly is fine, but let's stick to the pattern of loading options
  const [industryOptions, setIndustryOptions] = useState<string[]>(INDUSTRY_CATEGORIES)
  const [companyTypeOptions, setCompanyTypeOptions] = useState<string[]>(COMPANY_TYPES)
  const [sessionOptions, setSessionOptions] = useState<string[]>(SESSION_OPTIONS)

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 20

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
      try {
        const res = await getJobListings({
          page,
          pageSize,
          query: appliedQuery || undefined,
          location: appliedLocation || undefined,
          industry: appliedIndustries.length > 0 ? appliedIndustries : undefined,
          companyType: appliedCompanyTypes.length > 0 ? appliedCompanyTypes : undefined,
          session: appliedSession === "all" ? undefined : appliedSession,
        })

        setJobs(res.data)
        setTotal(res.count)
        setLoading(false)

        // Fetch collection status (do not block loading state)
        if (res.data.length > 0) {
          try {
            const status = await getJobCollectionStatus(res.data.map(j => j.id))
            setCollectionStatus(status)
          } catch (err) {
            console.error("Failed to fetch collection status", err)
            setCollectionStatus({})
          }
        } else {
          setCollectionStatus({})
        }
      } finally {
        // Ensure loading cleared even if listing请求失败
        setLoading(false)
      }
    }

    fetchData()
  }, [page, appliedQuery, appliedLocation, appliedIndustries, appliedCompanyTypes, appliedSession])

  const totalPages = Math.ceil(total / pageSize)

  const handleApply = () => {
    setPage(1)
    setAppliedQuery(query.trim())
    setAppliedLocation(location.trim())
    setAppliedIndustries(industries)
    setAppliedCompanyTypes(companyTypes)
    setAppliedSession(session)
  }

  const handleResetFilters = () => {
    setQuery("")
    setLocation("")
    setIndustries([])
    setCompanyTypes([])
    setSession("all")
    setAppliedQuery("")
    setAppliedLocation("")
    setAppliedIndustries([])
    setAppliedCompanyTypes([])
    setAppliedSession("all")
    setPage(1)
  }

  return (
    <Container className="py-8 space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
            <Input
              placeholder="搜索职位、公司..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply()
              }}
              className="pl-9"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("")
                  setAppliedQuery("") // Optional: auto-clear results too? Maybe not for search.
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar items-center">
            <div className="w-[140px] shrink-0 relative">
              <Input
                placeholder="工作地点"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApply()
                }}
              />
              {location && (
                <button
                  onClick={() => {
                    setLocation("")
                    // setAppliedLocation("") // Keep manual for text? Or auto? Let's keep manual consistency for text inputs.
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[140px] shrink-0 justify-between">
                  <span className="truncate">
                    {companyTypes.length === 0
                      ? "所有性质"
                      : companyTypes.length === 1
                        ? companyTypes[0]
                        : `已选${companyTypes.length}项`}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">选择多个性质</span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setCompanyTypes([])
                    setAppliedCompanyTypes([])
                    setPage(1)
                  }}>
                    清空
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {companyTypeOptions.map((opt) => {
                    const checked = companyTypes.includes(opt)
                    return (
                      <label
                        key={opt}
                        className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(isChecked) => {
                            setCompanyTypes((prev) => {
                              const next = isChecked
                                ? [...prev, opt]
                                : prev.filter((item) => item !== opt)
                              setAppliedCompanyTypes(next) // Auto apply
                              setPage(1)
                              return next
                            })
                          }}
                        />
                        <span className="truncate">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] shrink-0 justify-between">
                  <span className="truncate">
                    {industries.length === 0
                      ? "所有行业"
                      : industries.length === 1
                        ? industries[0]
                        : `已选${industries.length}项`}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">选择多个行业</span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setIndustries([])
                    setAppliedIndustries([])
                    setPage(1)
                  }}>
                    清空
                  </Button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {industryOptions.map((opt) => {
                    const checked = industries.includes(opt)
                    return (
                      <label
                        key={opt}
                        className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(isChecked) => {
                            setIndustries((prev) => {
                              const next = isChecked
                                ? [...prev, opt]
                                : prev.filter((item) => item !== opt)
                              setAppliedIndustries(next) // Auto apply
                              setPage(1)
                              return next
                            })
                          }}
                        />
                        <span className="truncate">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Select value={session} onValueChange={(val) => {
              setSession(val)
              setAppliedSession(val) // Auto apply
              setPage(1)
            }}>
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

            <Button
              onClick={handleApply}
              disabled={loading}
              className="shrink-0 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  查询中
                </>
              ) : (
                "查询"
              )}
            </Button>
            <Button variant="ghost" size="sm" className="shrink-0" onClick={handleResetFilters} disabled={loading}>
              清空
            </Button>
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
            <JobItem
              key={job.id}
              job={job}
              isCollected={collectionStatus[job.id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p>没有找到相关职位</p>
          <Button variant="link" onClick={() => {
            setQuery("")
            setLocation("")
            setIndustries([])
            setCompanyTypes([])
            setSession("all")
            setAppliedQuery("")
            setAppliedLocation("")
            setAppliedIndustries([])
            setAppliedCompanyTypes([])
            setAppliedSession("all")
            setPage(1)
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
