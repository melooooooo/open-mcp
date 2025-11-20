"use client"

import { useState } from "react"
import { Share2, Check, Copy } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"

interface ShareButtonProps {
  title: string
  url?: string
}

export function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const shareUrl = typeof window !== "undefined" ? window.location.href : (url || "")

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2" size="lg">
          <Share2 className="w-4 h-4" />
          分享这篇经验
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享经验</DialogTitle>
          <DialogDescription>
            复制下方链接，分享给你的朋友或同事。
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              defaultValue={shareUrl}
              readOnly
              className="h-9"
            />
          </div>
          <Button type="submit" size="sm" className="px-3" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                复制
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
