import { cn } from "@repo/ui/lib/utils"
import Image from "next/image"

interface LogoIconProps {
  type: "openmcp" | "studio"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function LogoIcon({ type, size = "md", className }: LogoIconProps) {
  const sizeMap = {
    sm: 24,
    md: 28,
    lg: 36,
    xl: 52,
  }

  const pixelSize = sizeMap[size]

  return (
    <Image
      src="/android-chrome-192x192.png"
      alt="银行帮"
      width={pixelSize}
      height={pixelSize}
      className={cn("rounded-sm", className)}
    />
  )
}

