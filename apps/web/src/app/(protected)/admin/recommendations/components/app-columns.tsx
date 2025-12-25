import { zodResolver } from "@hookform/resolvers/zod"
import { RecommendationAppWithApp } from "@repo/db/types"
import { Badge } from "@repo/ui/components/ui/badge"
import { Button } from "@repo/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowDown,ArrowUp, ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { trpc } from "@/lib/trpc/client"
import { getAssetUrl } from "@/lib/utils"

const formSchema = z.object({
  order: z.number().min(1),
})

export const useAppColumns = (recommendationId: string) => {
  const [editingApp, setEditingApp] = useState<RecommendationAppWithApp | null>(null)
  const [apps, setApps] = useState<RecommendationAppWithApp[]>([])
  const utils = trpc.useUtils()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      order: 1,
    },
  })

  const updateAppOrder = trpc.recommendations.updateAppOrder.useMutation({
    onSuccess: () => {
      setEditingApp(null)
      toast.success("更新成功")
      utils.recommendations.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteApp = trpc.recommendations.deleteApp.useMutation({
    onSuccess: () => {
      toast.success("删除成功")
      utils.recommendations.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleEditApp = (app: RecommendationAppWithApp) => {
    setEditingApp(app)
    form.setValue("order", app.order ?? 1)
  }

  const handleUpdateOrder = async (values: z.infer<typeof formSchema>) => {
    if (!editingApp) return

    try {
      await updateAppOrder.mutateAsync({
        id: editingApp.id,
        order: values.order,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleDeleteApp = async (app: RecommendationAppWithApp) => {
    try {
      await deleteApp.mutateAsync({ id: app.id })
    } catch (error) {
      console.error(error)
    }
  }

  const handleMoveUp = async (app: RecommendationAppWithApp) => {
    if (app.order <= 1) return

    try {
      await updateAppOrder.mutateAsync({
        id: app.id,
        order: app.order - 1,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const handleMoveDown = async (app: RecommendationAppWithApp) => {
    if (!apps || (app.order ?? 1) >= apps.length) return

    try {
      await updateAppOrder.mutateAsync({
        id: app.id,
        order: (app.order ?? 1) + 1,
      })
    } catch (error) {
      console.error(error)
    }
  }

  const columns: ColumnDef<RecommendationAppWithApp>[] = [
    {
      accessorKey: "app.icon",
      header: "图标",
      cell: ({ row }) => {
        const icon = row.original?.app?.icon
        return (
          <div className="w-8 h-8 relative">
            {icon ? (
              <Image
                src={getAssetUrl(icon)}
                alt="App icon"
                fill
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted rounded-md" />
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "app.name",
      header: "应用名称",
    },
    {
      accessorKey: "app.slug",
      header: "Slug",
    },
    {
      accessorKey: "order",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            排序
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "启用" : "待定"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const app = row.original

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">打开菜单</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEditApp(app)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMoveUp(app)}>
                  <ArrowUp className="mr-2 h-4 w-4" />
                  上移
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleMoveDown(app)}>
                  <ArrowDown className="mr-2 h-4 w-4" />
                  下移
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => handleDeleteApp(app)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
              open={!!editingApp}
              onOpenChange={(open) => {
                if (!open) {
                  setEditingApp(null)
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>编辑排序</DialogTitle>
                  <DialogDescription>
                    调整应用在推荐列表中的顺序
                  </DialogDescription>
                </DialogHeader>
                <Form {...(form as any)}>
                  <form onSubmit={form.handleSubmit(handleUpdateOrder)} className="space-y-4">
                    <FormField
                      control={form.control as any}
                      name="order"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>排序</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit">保存</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        )
      },
    },
  ]

  return {
    columns,
    setApps,
  }
} 