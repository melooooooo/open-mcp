import "@repo/ui/globals.css"
import "@/styles/custom.css"
import "@/styles/career-theme.css"

import { UmamiProvider } from "@repo/track";
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

import { geistMono, geistSans } from "./fonts";
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "开启你的银行生涯",
  description: "汇聚银行、券商、保险职位、网站合集与面试经验，应届生与社招的金融科技求职第一站。",
};

import { FeedbackButton } from "@/components/feedback/feedback-button"

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
          <FeedbackButton />
        </Providers>
      </body>
    </html>
  )
}
