"use client"

import { Ads, App, AppSubmission, Claims, Payment, Suggestion } from "@repo/db/types"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu"
import { Skeleton } from "@repo/ui/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs"
import type { ColumnDef } from "@tanstack/react-table"
import {
  ArrowLeft,
  BarChart,
  BrainCircuit,
  Calendar,
  Clock,
  CreditCard,
  Edit,
  Laptop,
  Mail,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  Server,
} from "lucide-react"
import Link from "next/link"
import { use, useState } from "react"

import { AdStatusBadge } from "@/components/ad-status-badge"
import { DataTable } from "@/components/admin/data-table"
import { PageHeader } from "@/components/admin/page-header"
import { PaymentStatusBadge } from "@/components/payment-status-badge"
import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils"

// 获取应用类型图标
function getAppTypeIcon(type: string) {
  switch (type) {
    case "client":
      return <Laptop className="h-4 w-4" />
    case "server":
      return <Server className="h-4 w-4" />
    default:
      return <BrainCircuit className="h-4 w-4" />
  }
}

// 获取支付方式文本
function getPaymentMethodText(method: string) {
  switch (method) {
    case "wechat":
      return "微信支付"
    case "alipay":
      return "支付宝"
    case "credit_card":
      return "信用卡"
    case "bank_transfer":
      return "银行转账"
    default:
      return method
  }
}

// 获取支付类型文本
function getPaymentTypeText(type: string) {
  switch (type) {
    case "ad":
      return "广告"
    case "subscription":
      return "订阅"
    case "service":
      return "服务"
    default:
      return "其他"
  }
}

// 获取建议类型文本
function getSuggestionTypeText(type: string) {
  switch (type) {
    case "feature":
      return "新功能"
    case "bug":
      return "Bug"
    case "improvement":
      return "改进"
    case "documentation":
      return "文档"
    default:
      return "其他"
  }
}

// 获取建议状态文本
function getSuggestionStatusText(status: string) {
  switch (status) {
    case "open":
      return "待处理"
    case "under_review":
      return "审核中"
    case "accepted":
      return "已接受"
    case "implemented":
      return "已实现"
    case "rejected":
      return "已拒绝"
    case "duplicate":
      return "重复"
    default:
      return status
  }
}

// 获取证明类型文本
function getProofTypeText(type: string) {
  switch (type) {
    case "github":
      return "GitHub 仓库"
    case "website":
      return "官方网站"
    case "email":
      return "官方邮箱"
    default:
      return "其他证明"
  }
}

// 部署状态徽章
function DeploymentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "running":
      return <Badge variant="default">运行中</Badge>
    case "stopped":
      return <Badge variant="secondary">已停止</Badge>
    case "failed":
      return <Badge variant="destructive">失败</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

// 添加骨架屏组件
const ProfileSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col items-center text-center space-y-3">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>
      ))}
    </div>
    <div>
      <Skeleton className="h-4 w-16 mb-2" />
      <Skeleton className="h-20 w-full" />
    </div>
    <div>
      <Skeleton className="h-4 w-16 mb-2" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-2 bg-muted rounded-md">
            <Skeleton className="h-5 w-5 mb-1" />
            <Skeleton className="h-6 w-8 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-24" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  </div>
)

// 提交表格列定义
const submissionColumns: ColumnDef<AppSubmission>[] = [
  {
    accessorKey: "name",
    header: "名称",
  },
  {
    accessorKey: "type",
    header: "类型",
    cell: ({ row }) => {
      const type = row.original.type
      return type === "client" ? "客户端" : type === "server" ? "服务器" : "应用"
    },
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={status === "approved" ? "default" : status === "pending" ? "secondary" : "destructive"}>
          {status === "approved" ? "已批准" : status === "pending" ? "待审核" : "已拒绝"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "submittedAt",
    header: "提交日期",
  },
  {
    accessorKey: "updatedAt",
    header: "更新日期",
  },
]

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const [activeTab, setActiveTab] = useState("profile")
  const { data: user, isLoading } = trpc.users.getByIdWithData.useQuery({ id: userId })

  const { data: apps } = trpc.apps.getListByUserId.useQuery({ userId })
  const { data: claims } = trpc.claims.getListByUserId.useQuery({ userId })
  const { data: suggestions } = trpc.suggestions.getListByUserId.useQuery({ userId })
  const { data: ads } = trpc.ads.getListByUserId.useQuery({ userId })
  const { data: submissions } = trpc.appSubmissions.getListByUserId.useQuery({ userId })
  const { data: payments } = trpc.payments.getListByUserId.useQuery({ userId })

  if (!user && !isLoading) {
    return <div>用户不存在</div>
  }

  // 应用表格列定义
  const appColumns: ColumnDef<App>[] = [
    {
      accessorKey: "name",
      header: "应用名称",
      cell: ({ row }) => {
        const app = row.original
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getAppTypeIcon(app.type)}
              <span className="font-medium">{app.name}</span>
            </div>
            {app.featured && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800"
              >
                精选
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }) => {
        const type = row.original.type
        return type === "client" ? "客户端" : type === "server" ? "服务器" : "应用"
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === "approved" ? "default" : status === "pending" ? "secondary" : "destructive"}>
            {status === "approved" ? "已批准" : status === "pending" ? "待审核" : "已拒绝"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "submittedAt",
      header: "提交日期",
    },
    {
      accessorKey: "stars",
      header: "星标数",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const app = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">操作菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/apps/${app.id}`}>查看详情</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/apps/${app.id}/edit`}>编辑</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // 广告表格列定义
  const adColumns: ColumnDef<Ads>[] = [
    {
      accessorKey: "title",
      header: "广告标题",
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.title}</div>
      },
    },
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }) => {
        return row.original.type === "listing" ? "列表广告" : "横幅广告"
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => <AdStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "price",
      header: "价格",
      cell: ({ row }) => `¥${row.original.price.toLocaleString()}`,
    },
    {
      accessorKey: "period",
      header: "投放期间",
      cell: ({ row }) => {
        const ad = row.original
        return ad.status === "pending" ? (
          <span className="text-muted-foreground">-</span>
        ) : (
          <span>
            {formatDate(ad.startDate)} 至 {formatDate(ad.endDate)}
          </span>
        )
      },
    },
    {
      accessorKey: "performance",
      header: "表现",
      cell: ({ row }) => {
        const ad = row.original
        return ad.impressions > 0 ? (
          <span>
            {ad.impressions.toLocaleString()} / {ad.clicks.toLocaleString()} ({ad.ctr}%)
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">操作菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/ads/${row.original.id}`}>查看详情</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]


  // 支付表格列定义
  const paymentColumns: ColumnDef<Payment>[] = [
    {
      accessorKey: "id",
      header: "订单号",
      cell: ({ row }) => {
        const payment = row.original
        return <div className="font-medium">{payment.invoiceNumber || `PAY-${payment.id}`}</div>
      },
    },
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }) => getPaymentTypeText(row.original.type),
    },
    {
      accessorKey: "amount",
      header: "金额",
      cell: ({ row }) => `¥${row.original.amount.toLocaleString()}`,
    },
    {
      accessorKey: "method",
      header: "支付方式",
      cell: ({ row }) => getPaymentMethodText(row.original.method),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "date",
      header: "日期",
      cell: ({ row }) => row.original.completedAt || row.original.createdAt,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">操作菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/payments/${row.original.id}`}>查看详情</Link>
                </DropdownMenuItem>
                {row.original.invoiceNumber ? (
                  <DropdownMenuItem>查看发票</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem>生成发票</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // 所有权申请表格列定义
  const claimColumns: ColumnDef<Claims>[] = [
    {
      accessorKey: "appName",
      header: "应用名称",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getAppTypeIcon(row.original.appType)}
              <span className="font-medium">{row.original.appName}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "proofType",
      header: "证明类型",
      cell: ({ row }) => getProofTypeText(row.original.proofType),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === "approved" ? "default" : status === "pending" ? "secondary" : "destructive"}>
            {status === "approved" ? "已批准" : status === "pending" ? "待审核" : "已拒绝"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "submittedAt",
      header: "提交日期",
    },
    {
      accessorKey: "approvedAt",
      header: "审核日期",
      cell: ({ row }) => formatDate(row.original.reviewedAt) || <span className="text-muted-foreground">-</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">操作菜单</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/claims/${row.original.id}`}>查看详情</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={row.original.proofUrl} target="_blank">
                    查看证明
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  // 建议表格列定义
  const suggestionColumns: ColumnDef<Suggestion>[] = [
    {
      accessorKey: "type",
      header: "类型",
      cell: ({ row }) => getSuggestionTypeText(row.original.type),
    },
    {
      accessorKey: "title",
      header: "标题",
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <Badge variant={status === "pending" ? "default" : status === "accepted" ? "secondary" : "destructive"}>
            {getSuggestionStatusText(status)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "submittedAt",
      header: "提交日期",
    },
    {
      accessorKey: "updatedAt",
      header: "更新日期",
    },
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="用户详情"
        description="查看和管理用户信息"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回用户列表
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/admin/users/${userId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                编辑
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={`/admin/users/${userId}/claims`}>查看所有权申请</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/admin/users/${userId}/suggestions`}>查看建议</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/admin/users/${userId}/ads`}>查看广告</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/admin/users/${userId}/submissions`}>查看提交</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">基本信息</TabsTrigger>
          <TabsTrigger value="apps">应用</TabsTrigger>
          <TabsTrigger value="claims">所有权申请</TabsTrigger>
          <TabsTrigger value="suggestions">建议</TabsTrigger>
          <TabsTrigger value="ads">广告</TabsTrigger>
          <TabsTrigger value="submissions">提交</TabsTrigger>
          <TabsTrigger value="deployments">部署</TabsTrigger>
          <TabsTrigger value="payments">支付</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>用户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? <ProfileSkeleton /> : (
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.image ?? undefined} alt={user?.name} />
                    <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{user?.name}</h3>
                    <p className="text-muted-foreground">{(user as any)?.position}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-sm">
                      {user?.role === "admin" ? "管理员" : "用户"}
                    </Badge>
                    <Badge variant={user?.banned === false ? "default" : "secondary"} className="text-sm">
                      {user?.banned === false ? "活跃" : "不活跃"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apps">
          <Card>
            <CardHeader>
              <CardTitle>应用</CardTitle>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error */}
              {isLoading ? <TableSkeleton /> : <DataTable columns={appColumns} data={apps} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>所有权申请</CardTitle>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error */}
              {isLoading ? <TableSkeleton /> : <DataTable columns={claimColumns} data={claims} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>建议</CardTitle>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error */}
              {isLoading ? <TableSkeleton /> : <DataTable columns={suggestionColumns} data={suggestions} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads">
          <Card>
            <CardHeader>
              <CardTitle>广告</CardTitle>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error */}
              {isLoading ? <TableSkeleton /> : <DataTable columns={adColumns} data={ads} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>提交</CardTitle>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error */}
              {isLoading ? <TableSkeleton /> : <DataTable columns={submissionColumns} data={submissions} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>支付</CardTitle>
            </CardHeader>
            <CardContent>
              {/* @ts-expect-error */}
              {isLoading ? <TableSkeleton /> : <DataTable columns={paymentColumns} data={payments} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

