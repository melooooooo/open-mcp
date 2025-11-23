import "@repo/ui/globals.css"
import "@/styles/custom.css"
import "@/styles/career-theme.css"

import { UmamiProvider } from "@repo/track";
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

import { geistMono, geistSans } from "./fonts";
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "银行帮 - 银行招聘求职平台",
  description: "专注银行招聘，汇聚各大银行校招、社招信息与面试经验，助力银行求职。"
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
    <html lang="zh-CN" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta name='apple-mobile-web-app-title' content='银行帮' />
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
