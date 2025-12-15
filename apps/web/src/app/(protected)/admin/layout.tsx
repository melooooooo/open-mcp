import { Separator } from "@repo/ui/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/ui/sidebar";
import {
  BarChart,
  ChartBar,
  CreditCard,
  FolderTree,
  Home,
  ShieldCheckIcon,
  Spline,
  Tags,
} from "lucide-react";
import {
  Lightbulb,
  Package,
  Shield,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import { AppBreadcrumb } from "@/components/admin/app-breadcrumb";
import { AppSidebar } from "@/components/admin/app-sidebar";
import type { IAppSidebarProps } from "@/components/admin/app-sidebar/sidebar";
import { UserNav } from "@/components/admin/user-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { auth } from "@/lib/auth";
import { LogoIcon } from "@/components/web/logo-icon";

// 模拟管理员认证检查
async function isAuthenticated() {
  // 在实际应用中，这里应该检查用户是否已登录并且是管理员
  const session = await auth.api.getSession({ headers: await headers() })
  console.info("[admin/layout.tsx] [isAuthenticated] session", session)
  // @ts-expect-error
  return session?.user?.role === "admin";
}

const defaultAppSidebarProps: IAppSidebarProps = {
  title: "银行帮",
  logo: <LogoIcon type="openmcp" size="sm" />,
  description: "管理后台",
  navItemList: [
    {
      title: "仪表盘",
      url: "/admin",
      icon: <Home />,
    },
    {
      title: "应用管理",
      url: "/admin/apps",
      icon: <Package />,
    },
    {
      title: "提交审核",
      url: "/admin/submissions",
      icon: <ShieldCheckIcon />,
    },
    {
      title: "分类管理",
      url: "/admin/categories",
      icon: <FolderTree />,
    },
    {
      title: "标签管理",
      url: "/admin/tags",
      icon: <Tags />,
    },
    {
      title: "应用推荐",
      url: "/admin/recommendations",
      icon: <Spline />,
    },
    {
      title: "用户管理",
      url: "/admin/users",
      icon: <Users />,
    },
  ],
  itemList: [
    {
      title: "应用排行",
      url: "/admin/rankings",
      icon: <ChartBar />,
    },
    {
      title: "广告管理",
      url: "/admin/ads",
      badge: "20",
      icon: <BarChart />,
    },
    {
      title: "支付管理",
      url: "/admin/payments",
      badge: "10",
      icon: <CreditCard />,
    },
    {
      title: "所有权申请",
      url: "/admin/claims",
      icon: <Shield />,
    },
    {
      title: "建议管理",
      url: "/admin/suggestions",
      icon: <Lightbulb />,
    },
  ],
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAdmin = await isAuthenticated();
  // 检查用户是否是管理员
  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div
      className={`antialiased min-h-screen bg-background`}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          {/* <Sidebar variant="inset">
            <SidebarHeader>
              <div className="flex items-center gap-2 p-4">
                <div className="font-bold text-xl">OpenMCP 管理后台</div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <AdminSidebarContent />
            </SidebarContent>
            <SidebarFooter>
              <div className="p-4 text-xs text-muted-foreground">
                © 2025 OpenMCP 管理系统
              </div>
            </SidebarFooter>
          </Sidebar> */}
          <AppSidebar {...defaultAppSidebarProps} />

          <SidebarInset className="overflow-auto">
            <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 bg-background">
              <div className="flex flex-1 items-center gap-2 px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <AppBreadcrumb />
              </div>
              <div className="ml-auto px-3">
                <UserNav />
              </div>
            </header>
            <main className="flex-1 flex flex-col p-4">{children}</main>
          </SidebarInset>
          {/* <SidebarInset>
            <main className="p-6">{children}</main>
          </SidebarInset> */}
        </SidebarProvider>

      </ThemeProvider>
      <Toaster />
    </div>
  );
}
