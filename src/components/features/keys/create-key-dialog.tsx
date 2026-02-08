"use client"

import { useState } from "react"
import { useCreateRedisKey } from "@/lib/api/hooks/redis"
import type { RedisDataType } from "@/types"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, FloppyDisk, X } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"

const keyTypes: RedisDataType[] = ["string", "hash", "list", "set", "zset"]

interface CreateKeyDialogProps {
  connectionId: string
  database: number
}

import { Key } from "@phosphor-icons/react"

export function CreateKeyDialog({ connectionId, database }: CreateKeyDialogProps) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState("")
  const [type, setType] = useState<RedisDataType>("string")
  const [value, setValue] = useState("")
  const [ttl, setTtl] = useState<string>("")

  const { mutate: createKey, isPending } = useCreateRedisKey(connectionId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!key.trim()) {
      toast.fail("Key name is required")
      return
    }

    let parsedValue: unknown = value

    // Parse value based on type
    if (type === "string") {
      parsedValue = value
    } else if (type === "hash") {
      try {
        parsedValue = JSON.parse(value || "{}")
      } catch {
        toast.fail('Invalid JSON for hash value. Use format: {"field": "value"}')
        return
      }
    } else if (type === "list" || type === "set") {
      try {
        parsedValue = JSON.parse(value || "[]")
      } catch {
        toast.fail('Invalid JSON for list/set value. Use format: ["item1", "item2"]')
        return
      }
    } else if (type === "zset") {
      try {
        parsedValue = JSON.parse(value || "[]")
      } catch {
        toast.fail('Invalid JSON for zset value. Use format: [{"member": "value", "score": 1}]')
        return
      }
    }

    createKey(
      {
        key: key.trim(),
        type,
        value: parsedValue,
        ttl: ttl ? parseInt(ttl, 10) : undefined,
        db: database,
      },
      {
        onSuccess: () => {
          toast.success("Key created successfully")
          setOpen(false)
          resetForm()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to create key")
        },
      }
    )
  }

  const resetForm = () => {
    setKey("")
    setType("string")
    setValue("")
    setTtl("")
  }

  const getValuePlaceholder = () => {
    switch (type) {
      case "string":
        return "Enter value..."
      case "hash":
        return '{"field": "value"}'
      case "list":
      case "set":
        return '["item1", "item2"]'
      case "zset":
        return '[{"member": "value", "score": 1}]'
      default:
        return "Enter value..."
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          New Key
        </Button>
      </DialogTrigger>
      <DialogContent size="default" className="p-0 overflow-hidden border-border/80">
        <form onSubmit={handleSubmit}>
          <div className="bg-success/5 border-b border-success/20">
            <DialogHeader className="p-4 flex-row items-center gap-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-success">
                <Key className="size-24 rotate-12" />
              </div>
              <div className="flex p-2 rounded-lg bg-success text-success-foreground shadow-lg shadow-success/20">
                <Key className="size-5" weight="bold" />
              </div>
              <div className="flex flex-col gap-0 z-10">
                <DialogTitle className="text-base font-bold">Create Key</DialogTitle>
                <DialogDescription className="text-xs text-foreground/60">
                  Database {database}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>

          <div className="grid gap-4 p-6">
            <div className="grid gap-2">
              <Label htmlFor="key" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Key Name</Label>
              <Input
                id="key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="my:key:name"
                className="font-mono h-10 border-primary/20 focus-visible:border-primary/50"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as RedisDataType)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {keyTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ttl" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">TTL (sec)</Label>
                <Input
                  id="ttl"
                  type="number"
                  value={ttl}
                  onChange={(e) => setTtl(e.target.value)}
                  placeholder="Persistent"
                  min={1}
                  className="h-10 font-mono"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Value</Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={getValuePlaceholder()}
                className="h-10 font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Composite types require valid JSON notation.
              </p>
            </div>
          </div>

          <DialogFooter className="bg-muted/10 border-t border-border/80 p-4 flex justify-between items-center w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-11 border-border/80 bg-background/50 hover:bg-muted/40 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 px-6"
            >
              <X size={18} weight="light" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !key.trim()}
              className="h-11 px-8 bg-success/80 hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
            >
              <FloppyDisk size={18} weight="bold" />
              {isPending ? "Creating..." : "Create Key"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  )
}
