"use client"

import { Button } from "@repo/ui/components/ui/button"
import { ShieldCheck, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ThemeToggle } from "@/components/theme-toggle"
import { Container } from "@/components/web/container"
import { LogoIcon } from "@/components/web/logo-icon"
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
      href: "/experiences",
      label: "经验",
      active: pathname?.startsWith("/experiences"),
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2" aria-label="返回首页">
              <LogoIcon type="openmcp" />
              <span className="font-bold hidden sm:inline-block">职启航</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="hidden md:flex items-center gap-6">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${route.active ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {route.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                {session ? (
                  <Link href="/web/dashboard">
                    <ShieldCheck className="h-4 w-4 mr-1" />
                    控制台
                  </Link>
                ) : (
                  <Link href="/auth/sign-in">
                    <User className="h-4 w-4 mr-2" />
                    登录
                  </Link>
                )}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </Container>
    </header>
  )
}
