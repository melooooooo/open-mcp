import { Footer } from "@/components/footer"
import { Header } from "@/components/web/header"
import type { ReactNode } from "react"

export default function UserLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
