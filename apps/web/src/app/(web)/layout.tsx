import Script from "next/script"
import type { ReactNode } from "react"
import type { Graph } from "schema-dts"
import { Toaster } from "sonner"

import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/web/header"
import { config } from "@/lib/config"

export default function WebLayout({
  children,
}: {
  children: ReactNode
}) {
  const url = config.site.url
  const jsonLd: Graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${url}/#/schema/organization/1`,
        name: config.site.name,
        url: `${url}/`,
        sameAs: [
          config.links.twitter,
          config.links.bluesky,
          config.links.mastodon,
          config.links.linkedin,
          config.links.github,
        ],
        logo: {
          "@type": "ImageObject",
          "@id": `${url}/#/schema/image/1`,
          url: `${url}/favicon.png`,
          width: "480",
          height: "480",
          caption: `${config.site.name} Logo`,
        },
      },
      {
        "@type": "Person",
        "@id": `${url}/#/schema/person/1`,
        name: "Piotr Kulpinski",
        sameAs: [config.links.author],
      },
      {
        "@type": "WebSite",
        url: config.site.url,
        name: config.site.name,
        description: config.site.description,
        inLanguage: "zh-CN",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${url}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        } as any,
        isPartOf: { "@id": `${url}#/schema/website/1` },
        about: { "@id": `${url}#/schema/organization/1` },
      },
    ],
  }
  return (
    <div className="antialiased min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Global background effects for dark mode */}
      <div className="hidden dark:block fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-violet-600/5 rounded-full blur-[120px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]"></div>
      </div>

      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="relative flex min-h-screen flex-col z-10">
          <Header />
          <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </div>
        <Toaster />
      </ThemeProvider>
      {/* JSON-LD */}
      <Script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  )
}

