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
      {/* 统一的悬浮反馈按钮 - 响应式设计 */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8 print:hidden">
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
      </div>

      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
