"use client"

import { Input } from "@repo/ui/components/ui/input"
import { useDebounce } from "@repo/ui/hooks/use-debounce"
import { AnimatePresence, motion } from "framer-motion"
import { Search, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useState, useTransition } from "react"

interface SearchBarProps {
  defaultValue?: string
  className?: string
}

export function SearchBar({ defaultValue = "" }: SearchBarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    if (debouncedQuery) {
      startTransition(() => {
        const params = new URLSearchParams()
        if (debouncedQuery) params.set("q", debouncedQuery)

        router.push(`/search?${params.toString()}`)
      })
    }
  }, [debouncedQuery, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(() => {
      const params = new URLSearchParams()
      if (query) params.set("q", query)

      router.push(`/search?${params.toString()}`)
    })
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: { duration: 0.3 },
        staggerChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.1 },
      },
    },
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="relative flex flex-col justify-start items-center">
        <div className="w-full sticky top-0 bg-transparent z-10 pt-4 pb-1">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center">
              <div className="relative flex-1">
                <Input
                  id="search"
                  type="text"
                  placeholder="搜索职位、经验或公司..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="pl-9 pr-3 py-1.5 h-10 text-sm rounded-lg focus-visible:ring-offset-0 bg-white/95 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/70 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm dark:shadow-[0_18px_60px_-45px_rgba(15,23,42,0.9)] backdrop-blur"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
                  <AnimatePresence mode="popLayout">
                    {query.length > 0 ? (
                      <motion.div
                        key="send"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Send className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="ml-2 px-4 py-2 h-10 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm dark:shadow-[0_10px_40px_-30px_rgba(59,130,246,0.8)]"
              >
                {isPending ? "搜索中..." : "搜索"}
              </button>
            </div>
          </form>
        </div>

        <AnimatePresence>
          {isFocused && query.length > 0 && (
            <motion.div
              className="w-full border rounded-md shadow-sm overflow-hidden dark:border-gray-800 bg-white dark:bg-black mt-1"
              variants={container}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <div className="px-3 py-2 text-sm text-gray-500">
                按回车键搜索 <span className="text-primary font-medium">"{query}"</span>
              </div>
              <div className="mt-2 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>ESC 取消</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
