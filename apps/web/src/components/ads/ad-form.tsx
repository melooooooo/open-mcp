import { zodResolver } from "@hookform/resolvers/zod";
import { CreateAds, zCreateAdsSchema } from "@repo/db/types";
import { Button } from "@repo/ui/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormFileUpload } from "@/components/file-uploader";

interface AdFormProps {
  initialData?: CreateAds;
  onSubmit: (data: CreateAds) => Promise<void>;
  isLoading?: boolean;
}

export function AdForm({ initialData, onSubmit, isLoading }: AdFormProps) {
  const form = useForm<CreateAds>({
    resolver: zodResolver(zCreateAdsSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "banner",
      startDate: new Date(),
      endDate: new Date(),
      price: 0,
      budget: 0,
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        form.setValue(key as keyof CreateAds, value);
      });
    }
  }, [initialData, form]);

  const handleImageUpload = (assetIds: string[]) => {
    if (assetIds.length > 0) {
      form.setValue("imageUrl", assetIds[0]);
    }
  };

  return (
    <Form {...(form as any)}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control as any}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>广告名称</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>广告类型</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="banner">横幅广告</SelectItem>
                      <SelectItem value="listing">列表广告</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>开始日期</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""} onChange={(e) => field.onChange(new Date(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>结束日期</FormLabel>
                  <FormControl>
                    <Input type="date" value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""} onChange={(e) => field.onChange(new Date(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control as any}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>单价 (¥)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>预算 (¥)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>广告图片 {field.value}</FormLabel>
                  <FormControl>
                    <FormFileUpload
                      label="上传广告图片"
                      description="支持 PNG、JPG、WebP 格式，建议尺寸 1200x628"
                      assetType="ad"
                      onUploadComplete={handleImageUpload}
                      initialPreviews={field.value ? [{ assetId: field.value }] : []}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control as any}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>广告描述</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 