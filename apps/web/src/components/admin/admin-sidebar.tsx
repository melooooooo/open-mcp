"use client"

import { Button } from "@repo/ui/components/ui/button"
import { ScrollArea } from "@repo/ui/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@repo/ui/components/ui/sheet"
import { cn } from "@repo/ui/lib/utils"
import {
  BarChart,
  ChevronDown,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Package,
  Settings,
  Shield,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type React from "react"
import { useState } from "react"

import { LogoIcon } from "@/components/web/logo-icon"

interface SidebarNavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  expanded?: boolean
  subItems?: {
    href: string
    label: string
    active?: boolean
    badge?: number
  }[]
  onToggleExpand?: () => void
}

function SidebarNavItem({ href, icon, label, active, badge, expanded, subItems, onToggleExpand }: SidebarNavItemProps) {
  const hasSubItems = subItems && subItems.length > 0

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <Link
          href={hasSubItems ? "#" : href}
          onClick={hasSubItems ? onToggleExpand : undefined}
          className={cn(
            "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted w-full",
            active && !hasSubItems ? "bg-muted" : "transparent",
          )}
        >
          {icon}
          <span className="ml-3 flex-1">{label}</span>
          {badge && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {badge}
            </span>
          )}
          {hasSubItems && (
            <div className="ml-auto">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          )}
        </Link>
      </div>

      {hasSubItems && expanded && (
        <div className="pl-6 space-y-1">
          {subItems.map((subItem, index) => (
            <Link
              key={index}
              href={subItem.href}
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                subItem.active ? "bg-muted" : "transparent",
              )}
            >
              <span className="flex-1">{subItem.label}</span>
              {subItem.badge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {subItem.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    apps: false,
    ads: false,
    payments: false,
    users: false,
    settings: false,
  })
  const [open, setOpen] = useState(false)

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // 计算待处理项数量
  const pendingItems = {
    apps: 2,
    claims: 3,
    suggestions: 5,
    ads: 2,
    payments: 1,
  }

  const totalPendingItems = Object.values(pendingItems).reduce((a, b) => a + b, 0)

  // 侧边栏导航项
  const navItems = [
    {
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "仪表盘",
      active: pathname === "/admin",
      badge: totalPendingItems,
    },
    {
      href: "/admin/apps",
      icon: <Package className="h-5 w-5" />,
      label: "应用管理",
      active: pathname.startsWith("/admin/apps"),
      expanded: expanded.apps,
      onToggleExpand: () => toggleExpand("apps"),
      badge: pendingItems.apps,
      subItems: [
        {
          href: "/admin/apps",
          label: "所有应用",
          active: pathname === "/admin/apps",
        },
        {
          href: "/admin/apps/pending",
          label: "待审核应用",
          active: pathname === "/admin/apps/pending",
          badge: pendingItems.apps,
        },
        {
          href: "/admin/apps/create",
          label: "添加应用",
          active: pathname === "/admin/apps/create",
        },
      ],
    },
    {
      href: "/admin/ads",
      icon: <BarChart className="h-5 w-5" />,
      label: "广告管理",
      active: pathname.startsWith("/admin/ads"),
      expanded: expanded.ads,
      onToggleExpand: () => toggleExpand("ads"),
      badge: pendingItems.ads,
      subItems: [
        {
          href: "/admin/ads",
          label: "所有广告",
          active: pathname === "/admin/ads",
        },
        {
          href: "/admin/ads/pending",
          label: "待审核广告",
          active: pathname === "/admin/ads/pending",
          badge: pendingItems.ads,
        },
        {
          href: "/admin/ads/analytics",
          label: "广告分析",
          active: pathname === "/admin/ads/analytics",
        },
      ],
    },
    {
      href: "/admin/payments",
      icon: <CreditCard className="h-5 w-5" />,
      label: "支付管理",
      active: pathname.startsWith("/admin/payments"),
      expanded: expanded.payments,
      onToggleExpand: () => toggleExpand("payments"),
      badge: pendingItems.payments,
      subItems: [
        {
          href: "/admin/payments",
          label: "所有支付",
          active: pathname === "/admin/payments",
        },
        {
          href: "/admin/payments/pending",
          label: "待处理支付",
          active: pathname === "/admin/payments/pending",
          badge: pendingItems.payments,
        },
        {
          href: "/admin/payments/invoices",
          label: "发票管理",
          active: pathname === "/admin/payments/invoices",
        },
      ],
    },
    {
      href: "/admin/claims",
      icon: <Shield className="h-5 w-5" />,
      label: "所有权申请",
      active: pathname.startsWith("/admin/claims"),
      badge: pendingItems.claims,
    },
    {
      href: "/admin/suggestions",
      icon: <Lightbulb className="h-5 w-5" />,
      label: "建议管理",
      active: pathname.startsWith("/admin/suggestions"),
      badge: pendingItems.suggestions,
    },
    {
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      label: "用户管理",
      active: pathname.startsWith("/admin/users"),
      expanded: expanded.users,
      onToggleExpand: () => toggleExpand("users"),
      subItems: [
        {
          href: "/admin/users",
          label: "所有用户",
          active: pathname === "/admin/users",
        },
        {
          href: "/admin/users/roles",
          label: "角色管理",
          active: pathname === "/admin/users/roles",
        },
        {
          href: "/admin/users/permissions",
          label: "权限管理",
          active: pathname === "/admin/users/permissions",
        },
      ],
    },
    {
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
      label: "系统设置",
      active: pathname.startsWith("/admin/settings"),
      expanded: expanded.settings,
      onToggleExpand: () => toggleExpand("settings"),
      subItems: [
        {
          href: "/admin/settings/general",
          label: "基本设置",
          active: pathname === "/admin/settings/general",
        },
        {
          href: "/admin/settings/appearance",
          label: "外观设置",
          active: pathname === "/admin/settings/appearance",
        },
        {
          href: "/admin/settings/security",
          label: "安全设置",
          active: pathname === "/admin/settings/security",
        },
      ],
    },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <LogoIcon type="openmcp" />
          <span>管理后台</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => (
            <SidebarNavItem
              key={index}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={item.active}
              badge={item.badge}
              expanded={item.expanded}
              subItems={item.subItems}
              onToggleExpand={item.onToggleExpand}
            />
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-sm">管理员</div>
            <div className="text-xs text-muted-foreground">admin@openmcp.cn</div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href="/login">
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Link>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* 移动端侧边栏 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button variant="outline" size="icon" className="absolute left-4 top-4 z-50">
            <Menu className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* 桌面端侧边栏 */}
      <div className="hidden lg:block w-[280px] border-r bg-background">{sidebarContent}</div>
    </>
  )
}

