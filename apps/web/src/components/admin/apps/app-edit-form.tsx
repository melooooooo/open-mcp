"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { zUpdateAppSchema } from "@repo/db/types";
import { Alert, AlertDescription, AlertTitle } from "@repo/ui/components/ui/alert";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Switch } from "@repo/ui/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui/tabs";
import { Textarea } from "@repo/ui/components/ui/textarea";
import type { MDEditorProps } from "@uiw/react-md-editor";
import { AlertCircle, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type SubmitHandler,useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { FormFileUpload } from "@/components/file-uploader";
import { trpc } from "@/lib/trpc/client";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic<MDEditorProps>(() => import("@uiw/react-md-editor"), { ssr: false });

type AppFormValues = z.infer<typeof zUpdateAppSchema>;

interface AppEditFormProps {
  appId: string;
}

export function AppEditForm({ appId }: AppEditFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 使用tRPC获取应用详情
  const { data: app, isLoading, error } = trpc.apps.getById.useQuery({ id: appId });

  // 使用tRPC更新应用
  const updateApp = trpc.apps.update.useMutation({
    onSuccess: () => {
      toast.success("应用已更新", {
        description: "应用信息已成功保存。",
      });
      router.push(`/admin/apps/${appId}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error("更新失败", {
        description: error.message,
      });
    },
  });

  // 初始化表单
  const form = useForm<AppFormValues>({
    resolver: zodResolver(zUpdateAppSchema),
    defaultValues: {
      id: appId,
      name: "",
      slug: "",
      description: "",
      longDescription: "",
      type: "client" as const,
      source: "submitted" as const,
      status: "pending" as const,
      icon: "",
      banner: "",
      website: "",
      github: "",
      docs: "",
      version: "",
      license: "",
      featured: false,
      scenario: "",
      verified: false,
      ownerName: "",
      readme: "",  // Add readme field default value
    },
    mode: "onChange",
  });

  // 当应用数据加载完成后，更新表单默认值
  useEffect(() => {
    if (app) {
      form.reset({
        id: app.id,
        name: app.name,
        slug: app.slug,
        description: app.description,
        longDescription: app.longDescription || "",
        type: app.type,
        source: app.source,
        status: app.status,
        icon: app.icon || "",
        banner: app.banner || "",
        website: app.website || "",
        github: app.github || "",
        docs: app.docs || "",
        version: app.version || "",
        license: app.license || "",
        featured: app.featured || false,
        scenario: app.scenario || "",
        verified: app.verified || false,
        ownerName: app.ownerName || "",
      }, {
        keepDefaultValues: true
      });
    }
  }, [app, form]);

  // 处理表单提交
  const onSubmit: SubmitHandler<AppFormValues> = async (values) => {
    try {
      setIsSubmitting(true);
      await updateApp.mutateAsync(values);
    } catch (error) {
      console.error("提交失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 生成slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  // 处理图片上传完成
  const handleIconUploadComplete = (assetIds: string[]) => {
    if (assetIds.length > 0) {
      form.setValue("icon", assetIds[0], { shouldDirty: true });
    }
  };

  const handleBannerUploadComplete = (assetIds: string[]) => {
    if (assetIds.length > 0) {
      form.setValue("banner", assetIds[0], { shouldDirty: true });
    }
  };

  // 渲染表单字段
  const renderFormFields = () => {
    const { control } = form;
    return (
      <>
        <FormField
          control={control as any}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input
                  placeholder="应用程序名称"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    // 如果slug为空，自动生成
                    if (!form.getValues("slug")) {
                      form.setValue("slug", generateSlug(e.target.value));
                    }
                  }}
                />
              </FormControl>
              <FormDescription>应用的显示名称</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control as any}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="application-slug" {...field} />
              </FormControl>
              <FormDescription>URL友好标识符。仅使用小写字母、数字和连字符。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control as any}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea placeholder="应用程序的简要描述" className="min-h-[80px]" {...field} />
              </FormControl>
              <FormDescription>应用程序的简短描述（最多255个字符）。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control as any}
          name="longDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>详细描述</FormLabel>
              <FormControl>
                <Textarea placeholder="应用程序的详细描述" className="min-h-[120px]" {...field} />
              </FormControl>
              <FormDescription>应用程序的更详细描述（可选）。</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control as any}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>类型</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择应用类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="client">客户端</SelectItem>
                    <SelectItem value="server">服务器</SelectItem>
                    <SelectItem value="application">应用程序</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>应用程序的类型。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-row gap-4 justify-between">
          <FormField
            control={control as any}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>图标 -- {field.value}</FormLabel>
                <FormControl>
                  <FormFileUpload
                    label="上传图标"
                    description="支持 PNG、JPG、SVG 格式，建议尺寸 512x512"
                    accept="image/*"
                    maxSize={2 * 1024 * 1024}
                    recommendedSize="512x512"
                    assetType="app_icon"
                    onUploadComplete={handleIconUploadComplete}
                    initialPreviews={field.value ? [{ assetId: field.value }] : []}
                  />
                </FormControl>
                <FormDescription>应用程序的图标。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control as any}
            name="banner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>横幅图片</FormLabel>
                <FormControl>
                  <FormFileUpload
                    label="上传横幅"
                    description="支持 PNG、JPG 格式，建议尺寸 1920x1080"
                    accept="image/*"
                    maxSize={5 * 1024 * 1024}
                    recommendedSize="1920x1080"
                    assetType="app_banner"
                    onUploadComplete={handleBannerUploadComplete}
                    initialPreviews={field.value ? [{ assetId: field.value }] : []}
                  />
                </FormControl>
                <FormDescription>应用程序的横幅图片。</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </>
    );
  };

  // 处理加载状态
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 处理错误状态
  if (error || !app) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>{error?.message || "无法加载应用信息，请稍后再试。"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>编辑应用: {app.name}</CardTitle>
        <CardDescription>更新应用程序的基本信息和详细信息。修改完成后，点击保存按钮提交更改。</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="details">详细信息</TabsTrigger>
                <TabsTrigger value="advanced">高级设置</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                {renderFormFields()}
              </TabsContent>

              <TabsContent value="details" className="space-y-4 pt-4">
                <FormField
                  control={form.control as any}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>网站</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormDescription>官方网站URL（可选）。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub</FormLabel>
                      <FormControl>
                        <Input placeholder="https://github.com/user/repo" {...field} />
                      </FormControl>
                      <FormDescription>GitHub仓库URL（可选）。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="docs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>文档</FormLabel>
                        <FormControl>
                          <Input placeholder="https://docs.example.com" {...field} />
                        </FormControl>
                        <FormDescription>文档URL（可选）。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="scenario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>应用场景</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：管理后台、电子商务、博客" {...field} />
                        </FormControl>
                        <FormDescription>主要使用场景（可选）。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>版本</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：1.0.0" {...field} />
                        </FormControl>
                        <FormDescription>当前版本（可选）。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="license"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>许可证</FormLabel>
                        <FormControl>
                          <Input placeholder="例如：MIT、Apache-2.0" {...field} />
                        </FormControl>
                        <FormDescription>软件许可证（可选）。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control as any}
                    name="readme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>README</FormLabel>
                        <FormControl>
                          <div data-color-mode="light">
                            <MDEditor
                              value={field.value || ""}
                              onChange={(value) => field.onChange(value || "")}
                              preview="edit"
                              height={400}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>应用程序的详细说明文档，支持Markdown格式。</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>精选</FormLabel>
                            <FormDescription>将此应用程序标记为目录中的精选应用。</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="verified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>已验证</FormLabel>
                            <FormDescription>将此应用程序标记为已验证。</FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <CardFooter className="flex justify-between px-0">
              <Button type="button" variant="outline" onClick={() => router.push(`/apps/${appId}`)}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting || (!form.formState.isDirty && !form.formState.dirtyFields.icon && !form.formState.dirtyFields.banner)}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存更改"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
