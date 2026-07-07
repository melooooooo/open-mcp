"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import Image from "next/image"
import { toast } from "sonner"

interface WechatQRCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WechatQRCodeDialog({ open, onOpenChange }: WechatQRCodeDialogProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>联系我们</DialogTitle>
          <DialogDescription>扫描下方二维码与我们联系</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4">
          <div className="rounded-lg mb-4">
            <Image
              src="/images/wechat-cr.jpeg"
              alt="微信二维码"
              width={240}
              height={240}
              className="rounded-md"
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">长按识别二维码联系我们</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

