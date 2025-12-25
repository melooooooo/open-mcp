"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { AlertCircle, Github, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { trpc } from "@/lib/trpc/client";
import { CategorySelect } from "@/components/admin/category-select";

const formSchema = z.object({
  gitHubURL: z.string().url("请输入有效的URL").startsWith("https://github.com/", "必须是GitHub仓库地址"),
  type: z.enum(["client", "server", "application"]),
  categoryId: z.string().optional(),
});

export function AddGitHubAppButton() {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { gitHubURL: "", type: "client", categoryId: "" },
  });

  // 获取当前选择的应用类型
  const selectedType = form.watch("type");

  // tRPC queries and mutations
  const { data: categoriesData, isLoading: isLoadingCategories } = trpc.categories.search.useQuery({
    limit: 100,
    page: 1,
  });

  // 根据应用类型过滤分类
  const filteredCategories = useMemo(() => {
    if (!categoriesData?.data) return [];

    const allCategories = categoriesData.data;

    // 找到对应的顶级分类
    const parentCategory = allCategories.find(cat => cat.slug === selectedType);

    if (!parentCategory) {
      // 如果没有找到对应的顶级分类，返回空数组
      return [];
    }

    // 返回该顶级分类下的所有子分类
    const childCategories = allCategories
      .filter(cat => cat.parentId === parentCategory.id && cat.status === "online")
      .map((item) => ({
        ...item,
        description: item.description || "",
      }));

    return childCategories;
  }, [categoriesData?.data, selectedType]);

  const createFromGitHub = trpc.apps.createFromGitHub.useMutation();

  const isPending = form.formState.isSubmitting || isProcessing;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsProcessing(true);
    try {
      const project = await createFromGitHub.mutateAsync({
        gitHubURL: values.gitHubURL,
        type: values.type,
        categoryId: values.categoryId || undefined,
      });

      if (project) {
        toast.success(`项目创建成功: ${project.name}`);
        setOpen(false);
        form.reset();
        router.push(`/admin/apps/${project.id}`);
      } else {
        toast.error("创建项目失败: 未返回项目数据");
      }
    } catch (error) {
      console.error("创建GitHub应用失败:", error);
      toast.error(`创建项目失败: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isPending) {
      return; // 防止在加载时关闭对话框
    }
    setOpen(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  // 当应用类型改变时，清空分类选择
  const handleTypeChange = (newType: string) => {
    form.setValue("type", newType as "client" | "server" | "application");
    form.setValue("categoryId", ""); // 清空分类选择
  };

  return (
    <Form {...(form as any)}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="default">
            <Github className="size-4 mr-2" />
            添加GitHub应用
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>添加GitHub应用</DialogTitle>
              <DialogDescription>
                通过GitHub仓库URL添加应用。系统将自动获取仓库信息并创建应用记录。
              </DialogDescription>
            </DialogHeader>

            {createFromGitHub.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createFromGitHub.error.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <Label htmlFor="gitHubURL" className="text-right">
                  GitHub URL *
                </Label>
                <FormField
                  control={form.control as any}
                  name="gitHubURL"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="https://github.com/owner/repo"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  应用类型 *
                </Label>
                <FormField
                  control={form.control as any}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          onValueChange={handleTypeChange}
                          value={field.value as string}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择应用类型" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">客户端应用</SelectItem>
                            <SelectItem value="server">服务器应用</SelectItem>
                            <SelectItem value="application">AI应用</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                <Label htmlFor="categoryId" className="text-right">
                  应用分类
                </Label>
                <FormField
                  control={form.control as any}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {isLoadingCategories ? (
                          <div className="flex items-center justify-center h-10 px-3 py-2 text-sm text-muted-foreground">
                            加载分类中...
                          </div>
                        ) : (
                          <CategorySelect
                            categories={filteredCategories}
                            name="categoryId"
                            placeholder={
                              filteredCategories.length > 0
                                ? "选择应用分类（可选）"
                                : "该应用类型暂无可用的分类"
                            }
                            disabled={isPending}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {isPending ? "创建中..." : "创建应用"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Form>
  );
}
