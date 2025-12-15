import { cn } from "@repo/ui/lib/utils"


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
    <img
      src="/icon-192.png"
      alt="银行帮"
      className={cn("w-auto", className)}
      style={{ height: `${pixelSize}px` }}
    />
  )
}

