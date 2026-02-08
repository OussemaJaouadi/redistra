"use client"

import { useState } from "react"
import { useUpdateRedisKey } from "@/lib/api/hooks/redis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"

interface HashEditorProps {
  connectionId: string
  keyName: string
  database: number
  value: Record<string, string>
  onUpdate?: () => void
}

export function HashEditor({ connectionId, keyName, database, value, onUpdate }: HashEditorProps) {
  const [fields, setFields] = useState<Record<string, string>>(() => value || {})
  const [newField, setNewField] = useState("")
  const [newValue, setNewValue] = useState("")
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editFieldName, setEditFieldName] = useState("")
  const { mutate: updateKey, isPending } = useUpdateRedisKey(connectionId, keyName, database)

  const handleAddField = () => {
    if (!newField.trim()) {
      toast.fail("Field name is required")
      return
    }

    if (fields[newField.trim()]) {
      toast.fail("Field already exists")
      return
    }

    const updatedFields = { ...fields, [newField.trim()]: newValue }
    updateKey(
      { value: updatedFields, db: database },
      {
        onSuccess: () => {
          toast.success("Field added")
          setNewField("")
          setNewValue("")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to add field")
        },
      }
    )
  }

  const handleDeleteField = (field: string) => {
    const updatedFields = { ...fields }
    delete updatedFields[field]
    updateKey(
      { value: updatedFields, db: database },
      {
        onSuccess: () => {
          toast.success("Field deleted")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to delete field")
        },
      }
    )
  }

  const handleUpdateFieldValue = (field: string, fieldValue: string) => {
    const updatedFields = { ...fields, [field]: fieldValue }
    updateKey(
      { value: updatedFields, db: database },
      {
        onSuccess: () => {
          toast.success("Field updated")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to update field")
        },
      }
    )
  }

  const handleStartEditFieldName = (field: string) => {
    setEditingField(field)
    setEditFieldName(field)
  }

  const handleCancelEditFieldName = () => {
    setEditingField(null)
    setEditFieldName("")
  }

  const handleSaveFieldName = (oldField: string) => {
    if (!editFieldName.trim()) {
      toast.fail("Field name cannot be empty")
      return
    }

    if (editFieldName.trim() === oldField) {
      setEditingField(null)
      return
    }

    if (fields[editFieldName.trim()]) {
      toast.fail("Field name already exists")
      return
    }

    const updatedFields: Record<string, string> = {}
    Object.entries(fields).forEach(([key, val]) => {
      if (key === oldField) {
        updatedFields[editFieldName.trim()] = val
      } else {
        updatedFields[key] = val
      }
    })

    updateKey(
      { value: updatedFields, db: database },
      {
        onSuccess: () => {
          toast.success("Field renamed")
          setEditingField(null)
          setEditFieldName("")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to rename field")
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {Object.entries(fields).map(([field, fieldValue]) => (
          <div key={field} className="rounded-sm border bg-muted/30 p-3 group">
            <div className="flex items-center gap-2 mb-2">
              {editingField === field ? (
                <>
                  <Input
                    value={editFieldName}
                    onChange={(e) => setEditFieldName(e.target.value)}
                    className="h-7 text-xs font-mono flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveFieldName(field)
                      if (e.key === "Escape") handleCancelEditFieldName()
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleSaveFieldName(field)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={handleCancelEditFieldName}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground font-mono flex-1 truncate">{field}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => handleStartEditFieldName(field)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={fieldValue}
                onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                onBlur={() => handleUpdateFieldValue(field, fields[field])}
                className="h-8 text-sm font-mono flex-1"
                placeholder="Value"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-destructive hover:text-destructive"
                onClick={() => handleDeleteField(field)}
                disabled={isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-sm border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground mb-2">Add New Field</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder="Field name"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              className="h-8 text-sm font-mono"
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="h-8 text-sm font-mono"
            />
          </div>
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleAddField}
            disabled={isPending || !newField.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
