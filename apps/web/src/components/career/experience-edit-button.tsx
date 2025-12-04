"use client";

import { Button } from "@repo/ui/components/ui/button";
import { Pencil } from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

interface ExperienceEditButtonProps {
  slug: string;
  className?: string;
}

export function ExperienceEditButton({
  slug,
  className,
}: ExperienceEditButtonProps) {
  // 检查编辑权限
  const { data: permission, isLoading } =
    trpc.experiences.checkEditPermission.useQuery(
      { slug },
      {
        retry: false,
        // 如果未登录或无权限，不显示错误
        onError: () => { },
      }
    );

  // 加载中或无权限时不显示按钮
  if (isLoading || !permission?.hasPermission) {
    return null;
  }

  return (
    <Button asChild size="sm" className={className}>
      <Link href={`/experiences/${slug}/edit`}>
        <Pencil className="mr-2 h-4 w-4" />
        编辑
      </Link>
    </Button>
  );
}
