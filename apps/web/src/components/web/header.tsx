"use client"

import { Button } from "@repo/ui/components/ui/button"
import { ShieldCheck, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { Container } from "@/components/web/container"
import { LogoIcon } from "@/components/web/logo-icon"
import { UserNav } from "@/components/web/user-nav"
import { useSession } from "@/hooks/auth-hooks"

export function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const routes = [
    {
      href: "/",
      label: "首页",
      active: pathname === "/",
    },
    {
      href: "/jobs",
      label: "职位",
      active: pathname?.startsWith("/jobs"),
    },
    {
      href: "/recruitment",
      label: "招聘",
      active: pathname?.startsWith("/recruitment"),
    },
    {
      href: "/experiences",
      label: "经验",
      active: pathname?.startsWith("/experiences"),
    },
    {
      href: "/referrals",
      label: "内推",
      active: pathname?.startsWith("/referrals"),
    },
    {
      href: "/companies",
      label: "公司",
      active: pathname?.startsWith("/companies"),
    },
    {
      href: "/salary",
      label: "薪酬",
      active: pathname?.startsWith("/salary"),
    },
    {
      href: "/help",
      label: "帮助中心",
      active: pathname?.startsWith("/help"),
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/80 dark:backdrop-blur-xl dark:border-slate-800/50">
      <Container>
        <div className="flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2 text-blue-600 group" aria-label="返回首页">
              <LogoIcon type="openmcp" className="text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-110" />
              <span className="font-bold hidden sm:inline-block text-blue-600 dark:text-white">职启航</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="hidden md:flex items-center gap-6">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400 relative py-2 ${route.active ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 dark:hover:text-white"
                    }`}
                >
                  {route.label}
                  {route.active && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              {session ? (
                <UserNav user={session.user} />
              ) : (
                <Button size="sm" className="rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition-colors dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500 dark:shadow-blue-600/20" asChild>
                  <Link href="/auth/sign-in">
                    <User className="h-4 w-4 mr-2" />
                    登录
                  </Link>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}
