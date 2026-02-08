"use client"

import { useState } from "react"
import { useRenameRedisKey } from "@/lib/api/hooks/redis"

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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/lib/toast"

interface RenameKeyDialogProps {
  connectionId: string
  keyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  database: number
}

export function RenameKeyDialog({
  connectionId,
  keyName,
  open,
  onOpenChange,
  database,
}: RenameKeyDialogProps) {
  const [newKey, setNewKey] = useState("")
  const [nx, setNx] = useState(true)

  const { mutate: renameKey, isPending } = useRenameRedisKey(connectionId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newKey.trim()) {
      toast.fail("New key name is required")
      return
    }

    if (newKey.trim() === keyName) {
      toast.fail("New key name must be different from current name")
      return
    }

    renameKey(
      {
        key: keyName,
        data: {
          newKey: newKey.trim(),
          db: database,
          nx,
        },
      },
      {
        onSuccess: () => {
          toast.success("Key renamed successfully")
          onOpenChange(false)
          setNewKey("")
          setNx(true)
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to rename key")
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Key</DialogTitle>
            <DialogDescription>
              Rename &quot;{keyName}&quot; to a new name
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Current Key</Label>
              <Input value={keyName} disabled className="font-mono bg-muted" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newKey">New Key Name</Label>
              <Input
                id="newKey"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="new:key:name"
                className="font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="nx"
                checked={nx}
                onCheckedChange={(checked) => setNx(checked === true)}
              />
              <Label htmlFor="nx" className="text-sm font-normal">
                Don&apos;t overwrite if new key exists (RENAMENX)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !newKey.trim()}>
              {isPending ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
