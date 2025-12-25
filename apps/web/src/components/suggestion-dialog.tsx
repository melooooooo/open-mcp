"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { type McpApp, zCreateSuggestionFormSchema } from "@repo/db/types"
import { Button } from "@repo/ui/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form"
import { Input } from "@repo/ui/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/ui/radio-group"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Bug, FileText, HelpCircle, Info, Lightbulb, Loader2, Sparkles, Upload, X } from "lucide-react"
import Image from "next/image"
import type React from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { AuthCheckWrapper } from "@/components/auth/auth-check-wrapper"
import { trpc } from "@/lib/trpc/client"
import { uploadToOSS } from "@/lib/utils"

interface SuggestionDialogProps {
  app: McpApp
}

export function SuggestionDialog({ app }: SuggestionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("feature")
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const utils = trpc.useUtils()

  const form = useForm<z.infer<typeof zCreateSuggestionFormSchema>>({
    resolver: zodResolver(zCreateSuggestionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "feature",
      priority: "medium",
      reproducible: false,
      stepsToReproduce: "",
      expectedBehavior: "",
      actualBehavior: "",
    },
  })

  // 当类型变化时更新UI
  const handleTypeChange = (value: string) => {
    setSelectedType(value)
    form.setValue("type", value as "feature" | "bug" | "improvement" | "other" | "documentation")
  }

  // 处理附件上传
  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件大小（5MB限制）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("文件过大", {
        description: "文件大小不能超过 5MB",
      })
      return
    }

    // 创建预览URL
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setAttachmentName(file.name)

    setIsUploading(true)
    try {
      // 使用OSS上传
      const result = await uploadToOSS(file, "suggestion-attachments")

      if (!result.success) {
        throw new Error(result.error || "上传失败")
      }

      form.setValue("attachmentUrl", result.assetId)
      toast.success("上传成功", {
        description: "文件已成功上传",
      })
    } catch (error) {
      toast.error("上传失败", {
        description: error instanceof Error ? error.message : "文件上传失败，请重试",
      })
      // 保留预览，即使上传失败
    } finally {
      setIsUploading(false)
    }
  }

  // 移除附件
  const handleRemoveAttachment = () => {
    setAttachmentName(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    form.setValue("attachmentUrl", undefined)
  }

  const createSuggestion = trpc.mcpSuggestions.create.useMutation({
    onSuccess: () => {
      toast.success("建议已提交", {
        description: "感谢您的反馈，您的建议已成功提交",
      })
      utils.mcpSuggestions.invalidate()
      form.reset()
      setAttachmentName(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      setOpen(false)
    },
    onError: (error) => {
      toast.error("提交失败", {
        description: error.message || "建议提交失败，请稍后重试",
      })
    },
  })

  const onSubmit = async (values: z.infer<typeof zCreateSuggestionFormSchema>) => {
    console.log("[suggestion] [onSubmit] values", values)
    setIsSubmitting(true)
    try {
      const result = await createSuggestion.mutateAsync({
        ...values,
        appId: app.id,
      })
      if (result) {
        toast.success("提交成功", {
          description: "您的建议已成功提交，感谢您的反馈！",
        })
        form.reset()
        setOpen(false)
      }
    } catch (error) {
      toast.error("提交失败", {
        description: error instanceof Error ? error.message : "提交过程中出现错误，请重试",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理打开对话框
  const handleOpenDialog = () => {
    setOpen(true)
  }

  return (
    <AuthCheckWrapper
      onAuthSuccess={handleOpenDialog}
      buttonText={
        <Button variant="outline" size="sm">
          <Lightbulb className="mr-2 h-4 w-4" />
          提交建议
        </Button>
      }
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col overflow-hidden ">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>为 {app.name} 提交建议</DialogTitle>
            <DialogDescription>分享您对这个应用的想法、功能建议或改进意见</DialogDescription>
          </DialogHeader>

          <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 no-scrollbar">
                <FormField
                  control={form.control as any}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>建议类型 *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={handleTypeChange}
                          defaultValue={field.value}
                          className="flex flex-wrap gap-2"
                        >
                          <div
                            className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "feature" ? "border-primary bg-primary/5" : "border-muted"}`}
                          >
                            <RadioGroupItem value="feature" id="feature" className="sr-only" />
                            <label
                              htmlFor="feature"
                              className="flex items-center gap-1.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <Sparkles className="h-4 w-4" />
                              新功能
                            </label>
                          </div>
                          <div
                            className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "bug" ? "border-primary bg-primary/5" : "border-muted"}`}
                          >
                            <RadioGroupItem value="bug" id="bug" className="sr-only" />
                            <label
                              htmlFor="bug"
                              className="flex items-center gap-1.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <Bug className="h-4 w-4" />
                              Bug报告
                            </label>
                          </div>
                          <div
                            className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "improvement" ? "border-primary bg-primary/5" : "border-muted"}`}
                          >
                            <RadioGroupItem value="improvement" id="improvement" className="sr-only" />
                            <label
                              htmlFor="improvement"
                              className="flex items-center gap-1.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <Lightbulb className="h-4 w-4" />
                              改进建议
                            </label>
                          </div>
                          <div
                            className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "documentation" ? "border-primary bg-primary/5" : "border-muted"}`}
                          >
                            <RadioGroupItem value="documentation" id="documentation" className="sr-only" />
                            <label
                              htmlFor="documentation"
                              className="flex items-center gap-1.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <FileText className="h-4 w-4" />
                              文档相关
                            </label>
                          </div>
                          <div
                            className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "other" ? "border-primary bg-primary/5" : "border-muted"}`}
                          >
                            <RadioGroupItem value="other" id="other" className="sr-only" />
                            <label
                              htmlFor="other"
                              className="flex items-center gap-1.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              <HelpCircle className="h-4 w-4" />
                              其他
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标题 *</FormLabel>
                      <FormControl>
                        <Input placeholder="简要描述您的建议..." {...field} />
                      </FormControl>
                      <FormDescription>标题至少需要5个字符，请简洁明了地描述您的建议</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>详细描述 *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="详细描述您的建议、问题或改进意见..."
                          className="resize-none"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        描述至少需要20个字符，请尽可能详细地描述您的建议，包括使用场景、预期效果等
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>附件</FormLabel>
                  <FormControl>
                    <div className="mt-1">
                      <div className="flex flex-col gap-4">
                        {/* 上传区域 */}
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="attachment"
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {isUploading ? (
                                <Loader2 className="w-8 h-8 mb-3 text-muted-foreground animate-spin" />
                              ) : (
                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                              )}
                              <p className="mb-2 text-sm text-muted-foreground">
                                {isUploading ? "上传中..." : "点击上传 或拖放文件"}
                              </p>
                              <p className="text-xs text-muted-foreground">支持图片、PDF等文件 (最大 5MB)</p>
                            </div>
                            <input
                              id="attachment"
                              type="file"
                              className="hidden"
                              onChange={handleAttachmentUpload}
                              disabled={isUploading}
                              accept="image/*,.pdf"
                            />
                          </label>
                        </div>

                        {/* 预览区域 - 始终显示，但根据状态条件渲染内容 */}
                        {attachmentName && (
                          <div className="space-y-2">
                            <div className="flex items-center p-2 rounded-md bg-muted/30">
                              <div className="flex-1 truncate">{attachmentName}</div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveAttachment}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* 图片预览 - 无论上传成功与否都显示 */}
                        {previewUrl && (
                          <div className="relative w-full h-48 rounded-md overflow-hidden border">
                            <Image src={previewUrl || "/placeholder.svg"} alt="预览" fill className="object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>可选，上传截图或其他相关文件</FormDescription>
                </FormItem>
              </div>

              <div className="flex-shrink-0 mt-auto pt-4 border-t bg-background sticky bottom-0">
                <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 text-sm mb-4">
                  <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-muted-foreground">
                    提交的建议将由应用维护者审核。我们可能会联系您获取更多信息。
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={isSubmitting || isUploading} className="min-w-[100px]">
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        提交中
                      </span>
                    ) : (
                      "提交建议"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AuthCheckWrapper>
  )
}
