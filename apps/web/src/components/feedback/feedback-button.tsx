"use client"

import { MessageSquareText } from "lucide-react"
import { useState } from "react"

import { Button } from "@repo/ui/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@repo/ui/components/ui/tooltip"

import { FeedbackDialog } from "./feedback-dialog"

export function FeedbackButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 hidden md:block print:hidden">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95"
                onClick={() => setOpen(true)}
              >
                <MessageSquareText className="h-6 w-6" />
                <span className="sr-only">意见反馈</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="mr-2">
              <p>有建议或问题？告诉我们吧</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Mobile version - maybe smaller or different position if needed, 
            but for now using the same floating button logic is standard.
            Usually on mobile floating buttons can block content, so be careful.
            The hidden md:block above hides it on mobile to avoid bad UX.
            We can enable it if requested. For now following common pattern of separate mobile nav or relying on desktop.
            Actually, let's enable it for all sizes but maybe adjust position/size if needed.
            Reverting local change to show on all screens.
         */}
      </div>

      {/* Mobile Version - Show on all screens for now, removing hidden md:block */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-8 print:hidden">
        <div className="group relative flex items-center">
          <div className="absolute right-full mr-2 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm shadow-md whitespace-nowrap pointer-events-none border">
            有建议或问题？告诉我们吧
          </div>
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-105 active:scale-95"
            onClick={() => setOpen(true)}
          >
            <MessageSquareText className="h-6 w-6" />
            <span className="sr-only">意见反馈</span>
          </Button>
        </div>
      </div>

      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
