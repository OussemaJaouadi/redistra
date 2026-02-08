"use client"

import { useEffect, useState } from "react"
import { useSetRedisKeyTtl } from "@/lib/api/hooks/redis"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/toast"
import { Clock, Database, Key } from "@phosphor-icons/react"

interface SetTtlDialogProps {
  connectionId: string
  keyName: string
  currentTtl?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  database: number
}

export function SetTtlDialog({
  connectionId,
  keyName,
  currentTtl,
  open,
  onOpenChange,
  database,
}: SetTtlDialogProps) {
  const [ttl, setTtl] = useState<string>(currentTtl && currentTtl > 0 ? currentTtl.toString() : "")

  const { mutate: setKeyTtl, isPending } = useSetRedisKeyTtl(connectionId)

  useEffect(() => {
    if (open) {
      setTtl(currentTtl && currentTtl > 0 ? currentTtl.toString() : "")
    }
  }, [open, currentTtl])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const ttlValue = ttl.trim() === "" ? undefined : parseInt(ttl, 10)

    if (ttlValue !== undefined && (isNaN(ttlValue) || ttlValue < 1)) {
      toast.fail("TTL must be a positive number")
      return
    }

    setKeyTtl(
      {
        key: keyName,
        data: {
          ttl: ttlValue,
          db: database,
        },
      },
      {
        onSuccess: () => {
          toast.success(ttlValue ? `TTL set to ${ttlValue} seconds` : "TTL removed (key will not expire)")
          onOpenChange(false)
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to set TTL")
        },
      }
    )
  }

  const formatCurrentTtl = () => {
    if (!currentTtl || currentTtl <= 0) return "No expiration"
    if (currentTtl < 60) return `${currentTtl}s`
    if (currentTtl < 3600) return `${Math.round(currentTtl / 60)}m`
    if (currentTtl < 86400) return `${Math.round(currentTtl / 3600)}h`
    return `${Math.round(currentTtl / 86400)}d`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="p-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="flex p-2 rounded-lg bg-secondary/15 text-secondary shadow-sm">
                <Clock className="size-5" weight="bold" />
              </div>
              <div className="flex flex-col gap-0.5">
                <DialogTitle>Set TTL</DialogTitle>
                <DialogDescription>
                  Control expiration for &quot;{keyName}&quot;.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="rounded-sm border bg-muted/30 p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Key className="h-3.5 w-3.5" />
                  Current TTL
                </span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  <Database className="h-3 w-3" />
                  DB {database}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono text-foreground">{formatCurrentTtl()}</div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ttl">New TTL (seconds)</Label>
              <Input
                id="ttl"
                type="number"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                placeholder="No expiration"
                min={1}
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setTtl("3600")}>
                  1 hour
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setTtl("86400")}>
                  1 day
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7" onClick={() => setTtl("604800")}>
                  7 days
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setTtl("")}>
                  Remove TTL
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to remove expiration. Key will persist indefinitely.
              </p>
            </div>
          </div>

          <DialogFooter className="bg-muted/20 border-t p-6 flex justify-between items-center w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="h-11 border-border/80 bg-background/50 hover:bg-muted/40 transition-all active:scale-95 px-6"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="h-11 px-8 transition-all active:scale-95">
              {isPending ? "Setting..." : "Set TTL"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
