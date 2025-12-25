"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { cn } from "@repo/ui/lib/utils";
import { ArrowLeft, BrainCircuit, Laptop, Server, Upload, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { trpc } from "@/lib/trpc/client";
import { uploadToOSS, saveFormData, getFormData, clearFormData } from "@/lib/utils";
import { useSession } from "@/hooks/auth-hooks";

// 表单验证模式
const formSchema = z.object({
  nickname: z.string().min(1, "昵称不能为空"),
  email: z.string().email("请输入有效的邮箱地址"),
  name: z.string().min(1, "应用名称不能为空"),
  description: z.string().min(10, "描述至少需要10个字符"),
  type: z.enum(["client", "server", "application"]),
  website: z.string().url("请输入有效的网址").optional().or(z.literal("")),
  github: z.string().url("请输入有效的GitHub仓库地址").optional().or(z.literal("")),
  tags: z.string().optional(),
  serverConfig: z.string().optional(),
  logoUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);

  // 使用tRPC mutation
  const submitMutation = trpc.mcpSubmit.create.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      // 提交成功后清除保存的表单数据
      clearFormData();
      setPendingLogoFile(null);
      toast.success("提交成功", {
        description: "您的应用信息已成功提交，我们将尽快审核",
      });
      router.push("/");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error("提交失败", {
        description: error.message || "提交应用时出错，请稍后再试",
      });
    },
  });

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: "",
      email: "",
      name: "",
      description: "",
      type: "client",
      website: "",
      github: "",
      tags: "",
      serverConfig: "",
      logoUrl: "",
    },
  });

  // 监听类型变化，以便显示/隐藏服务器配置字段
  const appType = form.watch("type");

  // 上传logo的函数
  const uploadLogo = useCallback(async (file: File) => {
    try {
      setIsUploading(true);

      // 使用OSS上传
      const result = await uploadToOSS(file, "app-logos");

      if (!result.success) {
        throw new Error(result.error || "上传失败");
      }

      form.setValue("logoUrl", result.url || "");
      setPendingLogoFile(null);
      toast.success("上传成功", {
        description: "图片已成功上传",
      });
    } catch (error) {
      toast.error("上传失败", {
        description: error instanceof Error ? error.message : "图片上传失败，请重试",
      });
      setLogoFile(null);
      setLogoPreview(null);
      setPendingLogoFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [form]);

  // 页面加载时恢复表单数据
  useEffect(() => {
    const savedData = getFormData();
    if (savedData) {
      // 恢复表单数据
      Object.keys(savedData).forEach((key) => {
        if (key in form.getValues()) {
          form.setValue(key as keyof FormValues, savedData[key]);
        }
      });

      // 如果有待处理的logo文件，提示用户重新上传
      if (savedData.pendingLogoFile) {
        toast.info("检测到之前未完成的logo上传", {
          description: "请重新选择logo文件以继续上传",
        });
      }
    }
  }, [form]);

  // 监听登录状态变化，处理待上传的logo文件
  useEffect(() => {
    if (session && pendingLogoFile) {
      // 用户已登录且有待上传的文件，自动上传
      toast.success("登录成功", {
        description: "正在继续上传您的logo文件...",
      });
      uploadLogo(pendingLogoFile);
    } else if (session) {
      // 用户刚登录成功，显示欢迎信息
      const savedData = getFormData();
      if (savedData?.pendingLogoFile) {
        toast.success("欢迎回来", {
          description: "您的表单数据已恢复，请继续完成logo上传",
        });
      } else if (savedData) {
        toast.success("欢迎回来", {
          description: "您的表单数据已自动恢复",
        });
      }
    }
  }, [session, pendingLogoFile, uploadLogo]);

  // 监听表单变化，自动保存数据
  useEffect(() => {
    const subscription = form.watch((value) => {
      // 保存表单数据到localStorage
      saveFormData({
        ...value,
        pendingLogoFile: pendingLogoFile ? true : false,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, pendingLogoFile]);

  // 页面卸载时清理数据
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 如果用户直接关闭页面，保留数据以便恢复
      // 这里不做特殊处理，让用户下次访问时可以选择是否恢复
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // 处理图片上传
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型和大小
    const validTypes = ["image/jpeg", "image/png", "image/svg+xml"];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
      toast.error("不支持的文件类型", {
        description: "请上传 JPG, PNG 或 SVG 格式的图片",
      });
      return;
    }

    if (file.size > maxSize) {
      toast.error("文件过大", {
        description: "图片大小不能超过 2MB",
      });
      return;
    }

    // 设置预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setLogoFile(file);
    setPendingLogoFile(file);

    // 检查用户是否已登录
    if (!session) {
      // 保存当前表单数据
      const currentFormData = form.getValues();
      saveFormData({
        ...currentFormData,
        pendingLogoFile: true,
      });

      toast.info("需要登录", {
        description: "上传logo需要先登录，即将跳转到登录页面",
      });

      // 跳转到登录页面，并设置重定向回当前页面
      const currentUrl = window.location.pathname + window.location.search;
      router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // 用户已登录，直接上传图片
    await uploadLogo(file);
  };

  // 删除图片
  const handleDeleteLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setPendingLogoFile(null);
    form.setValue("logoUrl", "");
  };

  // 提交表单
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      // 处理标签，将逗号分隔的字符串转换为数组
      const tags = values.tags ? values.tags.split(",").map(tag => tag.trim()) : [];

      await submitMutation.mutateAsync({
        ...values,
        tags,
        title: values.name,
      });
    } catch (error) {
      setIsSubmitting(false);
      // 错误已在mutation的onError中处理
    }
  };

  // 处理取消操作
  const handleCancel = () => {
    // 清除保存的数据
    clearFormData();
    setPendingLogoFile(null);
    router.back();
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="absolute left-4 top-4 md:left-8 md:top-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold mb-2">提交应用</h1>
          <p className="text-muted-foreground">分享您的 MCP 客户端、服务器或应用，让更多的人了解和使用您的产品</p>
        </div>

        <Form {...(form as any)}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>应用信息</CardTitle>
                <CardDescription>请填写您的应用信息，带 * 的字段为必填项</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>应用类型 *</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors ${appType === "client" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                        }`}
                      onClick={() => form.setValue("type", "client")}
                    >
                      <Laptop className="h-8 w-8 mb-2" />
                      <span className="cursor-pointer">客户端</span>
                      <p className="text-xs text-muted-foreground text-center mt-1">MCP 客户端应用</p>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors ${appType === "server" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                        }`}
                      onClick={() => form.setValue("type", "server")}
                    >
                      <Server className="h-8 w-8 mb-2" />
                      <span className="cursor-pointer">服务器</span>
                      <p className="text-xs text-muted-foreground text-center mt-1">MCP 服务器应用</p>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors ${appType === "application" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                        }`}
                      onClick={() => form.setValue("type", "application")}
                    >
                      <BrainCircuit className="h-8 w-8 mb-2" />
                      <span className="cursor-pointer">AI 应用</span>
                      <p className="text-xs text-muted-foreground text-center mt-1">基于 MCP 的应用</p>
                    </div>
                  </div>
                  <input type="hidden" {...form.register("type")} />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>个人昵称 *</FormLabel>
                        <FormControl>
                          <Input placeholder="您的昵称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>邮箱 *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as any}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder="例如：My MCP Client" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>应用描述 *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="简要描述您的应用功能和特点" {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control as any}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>官方网站</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="github"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub 仓库</FormLabel>
                        <FormControl>
                          <Input placeholder="https://github.com/username/repo" {...field} type="url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as any}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标签</FormLabel>
                      <FormControl>
                        <Input placeholder="用逗号分隔，例如：AI 助手, MCP 客户端, 自然语言" {...field} />
                      </FormControl>
                      <FormDescription>用逗号分隔多个标签</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="logo">应用图标 *</Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="logo"
                      className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
                        logoPreview ? "border-primary" : "bg-muted/40 hover:bg-muted/60",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {logoPreview ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img src={logoPreview} alt="Logo preview" className="max-h-28 max-w-28 object-contain" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteLogo();
                            }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                            disabled={isUploading}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {isUploading ? (
                            <div className="w-8 h-8 mb-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                          )}
                          <p className="mb-2 text-sm text-muted-foreground">
                            {isUploading ? "上传中..." : "点击上传 或拖放文件"}
                          </p>
                          <p className="text-xs text-muted-foreground">SVG, PNG 或 JPG (最大 2MB)</p>
                        </div>
                      )}
                      <input
                        id="logo"
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/svg+xml"
                        onChange={handleLogoChange}
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={handleCancel}>
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="min-w-[100px]"
                >
                  {isSubmitting || isUploading ? (
                    <div className="flex items-center">
                      <span className="mr-2">提交中</span>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </div>
                  ) : (
                    "提交应用"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  );
}
