"use client"

import { useState } from "react"
import { useUpdateRedisKey } from "@/lib/api/hooks/redis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"

interface SetEditorProps {
  connectionId: string
  keyName: string
  database: number
  value: { members: string[] }
  onUpdate?: () => void
}

export function SetEditor({ connectionId, keyName, database, value, onUpdate }: SetEditorProps) {
  const [members, setMembers] = useState<string[]>(() => value?.members || [])
  const [newMember, setNewMember] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState("")
  const { mutate: updateKey, isPending } = useUpdateRedisKey(connectionId, keyName, database)

  const handleAddMember = () => {
    if (!newMember.trim()) {
      toast.fail("Member value is required")
      return
    }

    if (members.includes(newMember.trim())) {
      toast.fail("Member already exists")
      return
    }

    const updatedMembers = [...members, newMember.trim()]
    updateKey(
      { value: updatedMembers, db: database },
      {
        onSuccess: () => {
          toast.success("Member added")
          setMembers(updatedMembers)
          setNewMember("")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to add member")
        },
      }
    )
  }

  const handleDeleteMember = (member: string) => {
    const updatedMembers = members.filter((m) => m !== member)
    updateKey(
      { value: updatedMembers, db: database },
      {
        onSuccess: () => {
          toast.success("Member deleted")
          setMembers(updatedMembers)
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to delete member")
        },
      }
    )
  }

  const handleStartEdit = (index: number) => {
    setEditingIndex(index)
    setEditValue(members[index])
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue("")
  }

  const handleSaveEdit = (index: number) => {
    if (!editValue.trim()) {
      toast.fail("Member value cannot be empty")
      return
    }

    if (editValue.trim() === members[index]) {
      setEditingIndex(null)
      return
    }

    if (members.includes(editValue.trim())) {
      toast.fail("Member already exists")
      return
    }

    const updatedMembers = [...members]
    updatedMembers[index] = editValue.trim()
    updateKey(
      { value: updatedMembers, db: database },
      {
        onSuccess: () => {
          toast.success("Member updated")
          setMembers(updatedMembers)
          setEditingIndex(null)
          setEditValue("")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to update member")
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {members.map((member, index) => (
          <div key={`${member}-${index}`} className="flex items-center gap-2 rounded-sm border bg-muted/30 p-2 group">
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
                  value={member}
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
                  onClick={() => handleDeleteMember(member)}
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
        <p className="text-xs text-muted-foreground mb-2">Add New Member</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Member value..."
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            className="flex-1 h-8 text-sm font-mono"
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleAddMember}
            disabled={isPending || !newMember.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
