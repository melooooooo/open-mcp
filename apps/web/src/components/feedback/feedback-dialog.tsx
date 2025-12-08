"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { zCreateSiteFeedback, zSiteFeedbackTypeEnum } from "@repo/db/types"
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

import { trpc } from "@/lib/trpc/client"
import { uploadToOSS } from "@/lib/utils"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<string>("feature")
  const [attachmentName, setAttachmentName] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Use createSiteFeedback schema but ensure userEmail handles null/undefined correctly
  // The backend schema allows optional/literal("") but frontend form might treat as undefined
  const form = useForm<z.infer<typeof zCreateSiteFeedback>>({
    resolver: zodResolver(zCreateSiteFeedback),
    defaultValues: {
      title: "",
      description: "",
      type: "feature",
      userEmail: "",
    },
  })

  const handleTypeChange = (value: string) => {
    setSelectedType(value)
    form.setValue("type", value as z.infer<typeof zSiteFeedbackTypeEnum>)
  }

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("文件过大", {
        description: "文件大小不能超过 5MB",
      })
      return
    }

    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setAttachmentName(file.name)

    setIsUploading(true)
    try {
      const result = await uploadToOSS(file, "feedback-attachments")

      if (!result.success) {
        throw new Error(result.error || "上传失败")
      }

      form.setValue("attachmentUrl", result.assetId)
      toast.success("上传成功")
    } catch (error) {
      toast.error("上传失败", {
        description: error instanceof Error ? error.message : "文件上传失败，请重试",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAttachment = () => {
    setAttachmentName(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    form.setValue("attachmentUrl", undefined)
  }

  const createFeedback = trpc.siteFeedbacks.create.useMutation({
    onSuccess: () => {
      toast.success("反馈已提交", {
        description: "感谢您的反馈，我们会认真阅读您的建议！",
      })
      form.reset()
      setAttachmentName(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error("提交失败", {
        description: error.message || "提交失败，请稍后重试",
      })
    },
  })

  const onSubmit = async (values: z.infer<typeof zCreateSiteFeedback>) => {
    setIsSubmitting(true)
    try {
      await createFeedback.mutateAsync(values)
    } catch (error) {
      // Handled by onError
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>意见反馈</DialogTitle>
          <DialogDescription>
            我们非常重视您的建议，帮助我们做得更好
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4 no-scrollbar">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>反馈类型 *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={handleTypeChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-2"
                      >
                        <div
                          className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "feature" ? "border-primary bg-primary/5" : "border-muted"}`}
                        >
                          <RadioGroupItem value="feature" id="feedback-feature" className="sr-only" />
                          <label
                            htmlFor="feedback-feature"
                            className="flex items-center gap-1.5 text-sm font-medium leading-none cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            新功能
                          </label>
                        </div>
                        <div
                          className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "bug" ? "border-primary bg-primary/5" : "border-muted"}`}
                        >
                          <RadioGroupItem value="bug" id="feedback-bug" className="sr-only" />
                          <label
                            htmlFor="feedback-bug"
                            className="flex items-center gap-1.5 text-sm font-medium leading-none cursor-pointer"
                          >
                            <Bug className="h-4 w-4" />
                            Bug报告
                          </label>
                        </div>
                        <div
                          className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "improvement" ? "border-primary bg-primary/5" : "border-muted"}`}
                        >
                          <RadioGroupItem value="improvement" id="feedback-improvement" className="sr-only" />
                          <label
                            htmlFor="feedback-improvement"
                            className="flex items-center gap-1.5 text-sm font-medium leading-none cursor-pointer"
                          >
                            <Lightbulb className="h-4 w-4" />
                            改进建议
                          </label>
                        </div>
                        <div
                          className={`flex items-center space-x-2 rounded-md border p-2 ${selectedType === "other" ? "border-primary bg-primary/5" : "border-muted"}`}
                        >
                          <RadioGroupItem value="other" id="feedback-other" className="sr-only" />
                          <label
                            htmlFor="feedback-other"
                            className="flex items-center gap-1.5 text-sm font-medium leading-none cursor-pointer"
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
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题 *</FormLabel>
                    <FormControl>
                      <Input placeholder="简要描述您的反馈..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系邮箱 (可选)</FormLabel>
                    <FormControl>
                      <Input placeholder="如果不介意，可以留下您的邮箱..." {...field} />
                    </FormControl>
                    <FormDescription>方便我们后续联系您了解详情</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>详细描述 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请尽可能详细地描述..."
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>附件 (例如截图)</FormLabel>
                <FormControl>
                  <div className="mt-1">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-center w-full">
                        <label
                          htmlFor="feedback-attachment"
                          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                              <Loader2 className="w-8 h-8 mb-3 text-muted-foreground animate-spin" />
                            ) : (
                              <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                            )}
                            <p className="mb-2 text-sm text-muted-foreground">
                              {isUploading ? "上传中..." : "点击上传"}
                            </p>
                          </div>
                          <input
                            id="feedback-attachment"
                            type="file"
                            className="hidden"
                            onChange={handleAttachmentUpload}
                            disabled={isUploading}
                            accept="image/*,.pdf"
                          />
                        </label>
                      </div>

                      {attachmentName && (
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
                      )}

                      {previewUrl && (
                        <div className="relative w-full h-48 rounded-md overflow-hidden border">
                          <Image src={previewUrl} alt="预览" fill className="object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            </div>

            <div className="flex-shrink-0 mt-auto pt-4 border-t bg-background sticky bottom-0">
              <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2 text-sm mb-4">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-muted-foreground">
                  您的反馈对我们非常重要，我们会尽快处理。
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading} className="min-w-[100px]">
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中
                    </span>
                  ) : (
                    "提交"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
