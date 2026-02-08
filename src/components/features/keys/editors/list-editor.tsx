"use client"

import { useState } from "react"
import { useUpdateRedisKey } from "@/lib/api/hooks/redis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"

interface ListEditorProps {
  connectionId: string
  keyName: string
  database: number
  value: { items: string[] }
  onUpdate?: () => void
}

export function ListEditor({ connectionId, keyName, database, value, onUpdate }: ListEditorProps) {
  const [items, setItems] = useState<string[]>(() => value?.items || [])
  const [newItem, setNewItem] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const { mutate: updateKey, isPending } = useUpdateRedisKey(connectionId, keyName, database)

  const handleAddItem = () => {
    if (!newItem.trim()) {
      toast.fail("Item value is required")
      return
    }

    const updatedItems = [...items, newItem.trim()]
    updateKey(
      { value: updatedItems, db: database },
      {
        onSuccess: () => {
          toast.success("Item added")
          setItems(updatedItems)
          setNewItem("")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to add item")
        },
      }
    )
  }

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)
    updateKey(
      { value: updatedItems, db: database },
      {
        onSuccess: () => {
          toast.success("Item deleted")
          setItems(updatedItems)
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to delete item")
        },
      }
    )
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(items[index])
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue("")
  }

  const handleSaveEdit = (index: number) => {
    if (!editValue.trim()) {
      toast.fail("Item value cannot be empty")
      return
    }

    if (editValue.trim() === items[index]) {
      setEditingIndex(null)
      return
    }

    const updatedItems = [...items]
    updatedItems[index] = editValue.trim()
    updateKey(
      { value: updatedItems, db: database },
      {
        onSuccess: () => {
          toast.success("Item updated")
          setItems(updatedItems)
          setEditingIndex(null)
          setEditValue("")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to update item")
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${index}-${item}`} className="flex items-center gap-2 rounded-sm border bg-muted/30 p-2 group">
            <span className="text-xs text-muted-foreground w-8 shrink-0">#{index}</span>
            
            {editingIndex === index ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 h-8 text-sm font-mono"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(index)
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => handleSaveEdit(index)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Input
                  value={item}
                  disabled
                  className="flex-1 h-8 text-sm font-mono bg-transparent border-0"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                  onClick={() => handleStartEdit(index)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteItem(index)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-sm border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground mb-2">Add New Item</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Item value..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="flex-1 h-8 text-sm font-mono"
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleAddItem}
            disabled={isPending || !newItem.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
