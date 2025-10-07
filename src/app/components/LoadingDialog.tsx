"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

export function LoadingDialog({ open }: { open: boolean }) {
  return (
    <Dialog open={open}>
      <DialogContent className="[&>button]:hidden">
        <DialogTitle />
        <div className="flex flex-col items-center gap-4 p-6 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-700">Loading project details…</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
