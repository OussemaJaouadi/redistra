"use client"

import { useDeleteRedisKey } from "@/lib/api/hooks/redis"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Warning, Database, Key } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"

interface DeleteKeyDialogProps {
  connectionId: string
  keyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  database: number
}

export function DeleteKeyDialog({
  connectionId,
  keyName,
  open,
  onOpenChange,
  database,
}: DeleteKeyDialogProps) {
  const { mutate: deleteKey, isPending } = useDeleteRedisKey(connectionId)

  const handleDelete = () => {
    deleteKey({ key: keyName, db: database }, {
      onSuccess: () => {
        toast.success("Key deleted successfully")
        onOpenChange(false)
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to delete key"
        toast.fail(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="p-0 overflow-hidden border-destructive/20">
        <div className="bg-destructive/10 border-b border-destructive/20">
          <DialogHeader className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
              <Warning className="size-16" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex p-2 rounded-lg bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20">
                <Warning className="size-5" weight="bold" />
              </div>
              <div className="flex flex-col gap-0.5">
                <DialogTitle className="text-destructive">Delete Key</DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Key className="h-3.5 w-3.5" />
                Key
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                <Database className="h-3 w-3" />
                DB {database}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-destructive font-mono break-all">{keyName}</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Deleting a key removes all data stored under it. You can recreate it later, but values will be lost.
          </p>
        </div>

        <DialogFooter className="bg-destructive/5 border-t border-destructive/20 p-6 flex justify-between items-center w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="h-11 border-border/80 bg-background/50 hover:bg-muted/40 transition-all active:scale-95 px-6"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="h-11 px-8 shadow-lg shadow-destructive/10 transition-all active:scale-95"
          >
            {isPending ? "Deleting..." : "Delete Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
