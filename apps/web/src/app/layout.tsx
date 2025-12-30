import "@repo/ui/globals.css"
import "@/styles/custom.css"
import "@/styles/career-theme.css"

import { UmamiProvider } from "@repo/track";
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

import { geistMono, geistSans } from "./fonts";
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: {
    default: "银行帮 - 银行招聘求职第一站",
    template: "%s | 银行帮"
  },
  description: "银行帮专注银行业招聘求职，提供各大银行校招、社招岗位信息，涵盖券商、保险等金融机构职位。分享面试经验、内推信息，助力应届生与职场人顺利进入金融科技领域。",
  keywords: ["银行招聘", "银行校招", "银行面试经验", "金融求职", "金融科技", "券商招聘", "保险招聘", "内推"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:30001"),
  alternates: {
    canonical: "/",
  },
  other: {
    "apple-mobile-web-app-title": "银行帮"
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "银行帮",
    title: "银行帮 - 银行招聘求职指南",
    description: "汇聚银行、券商、保险职位、网站合集与面试经验，助力您的金融求职之路。",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "银行帮 - 银行招聘求职指南"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "银行帮 - 银行招聘求职指南",
    description: "汇聚银行、券商、保险职位、网站合集与面试经验。",
    images: ["/og-image.png"],
  }
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
        <UmamiProvider />
        <script defer data-domain="yinhangbang.com" src="https://app.pageview.app/js/script.js"></script>
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
