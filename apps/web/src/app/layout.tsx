import "@repo/ui/globals.css"
import "@/styles/custom.css"
import "@/styles/career-theme.css"

import { UmamiProvider } from "@repo/track";
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

import { geistMono, geistSans } from "./fonts";
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "职启航 - 秋招应届生求职平台",
  description: "汇聚名企职位、内推机会、面试经验，助力应届生成功斩获心仪offer"
};

export const viewport: Viewport = {
  initialScale: 1,
  viewportFit: "cover",
  width: "device-width",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(1 0 0)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.145 0 0)" }
  ]
}

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name='apple-mobile-web-app-title' content='共绩算力' />
        <UmamiProvider />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="flex min-h-svh flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
