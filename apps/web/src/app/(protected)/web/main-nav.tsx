"use client"

import { UserButton } from "@daveyplate/better-auth-ui"
import { Button } from "@repo/ui/components/ui/button"
import Link from "next/link"

import { LogoIcon } from "@/components/web/logo-icon"
export function MainNav() {

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between space-x-2 md:justify-end p-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <LogoIcon type="openmcp" size="sm" />
          </Link>
        </div>
        <div className='ml-auto px-3 flex items-center space-x-4 gap-2'>
          <UserButton
            classNames={{
              trigger: {
                base: "flex items-center gap-2 rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background text-sm font-medium",
                user: {
                  base: "flex items-center gap-2"
                }
              },
              content: {
                base: "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                menuItem: "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                separator: "mx-1 my-1 h-px bg-muted",
                user: {
                  base: "flex items-center gap-2 p-2"
                }
              }
            }}
            disableDefaultLinks={false}
          />
        </div>
      </div>
    </header>
  )
}
