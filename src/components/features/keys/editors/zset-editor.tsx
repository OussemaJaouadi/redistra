"use client"

import { useState } from "react"
import { useUpdateRedisKey } from "@/lib/api/hooks/redis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"

interface ZSetMember {
  member: string
  score: number
}

interface ZSetEditorProps {
  connectionId: string
  keyName: string
  database: number
  value: { members: ZSetMember[] }
  onUpdate?: () => void
}

export function ZSetEditor({ connectionId, keyName, database, value, onUpdate }: ZSetEditorProps) {
  const [members, setMembers] = useState<ZSetMember[]>(() => value?.members || [])
  const [newMember, setNewMember] = useState("")
  const [newScore, setNewScore] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editMember, setEditMember] = useState("")
  const [editScore, setEditScore] = useState("")
  const { mutate: updateKey, isPending } = useUpdateRedisKey(connectionId, keyName, database)

  const handleAddMember = () => {
    if (!newMember.trim()) {
      toast.fail("Member value is required")
      return
    }

    const score = parseFloat(newScore)
    if (isNaN(score)) {
      toast.fail("Score must be a number")
      return
    }

    const existingIndex = members.findIndex(m => m.member === newMember.trim())
    let updatedMembers: ZSetMember[]
    
    if (existingIndex >= 0) {
      updatedMembers = [...members]
      updatedMembers[existingIndex] = { member: newMember.trim(), score }
    } else {
      updatedMembers = [...members, { member: newMember.trim(), score }]
    }

    updateKey(
      { value: updatedMembers, db: database },
      {
        onSuccess: () => {
          toast.success(existingIndex >= 0 ? "Member updated" : "Member added")
          setMembers(updatedMembers)
          setNewMember("")
          setNewScore("")
          onUpdate?.()
        },
        onError: (error: unknown) => {
          toast.fail(error instanceof Error ? error.message : "Failed to add member")
        },
      }
    )
  }

  const handleDeleteMember = (member: string) => {
    const updatedMembers = members.filter((m) => m.member !== member)
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
    setEditMember(members[index].member)
    setEditScore(members[index].score.toString())
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditMember("")
    setEditScore("")
  }

  const handleSaveEdit = (index: number) => {
    if (!editMember.trim()) {
      toast.fail("Member value cannot be empty")
      return
    }

    const score = parseFloat(editScore)
    if (isNaN(score)) {
      toast.fail("Score must be a number")
      return
    }

    const oldMember = members[index].member
    
    if (editMember.trim() === oldMember && score === members[index].score) {
      setEditingIndex(null)
      return
    }

    // Check if new member name already exists (and it's not the same member being edited)
    if (editMember.trim() !== oldMember && members.some((m, i) => i !== index && m.member === editMember.trim())) {
      toast.fail("Member already exists")
      return
    }

    const updatedMembers = [...members]
    updatedMembers[index] = { member: editMember.trim(), score }
    
    updateKey(
      { value: updatedMembers, db: database },
      {
        onSuccess: () => {
          toast.success("Member updated")
          setMembers(updatedMembers)
          setEditingIndex(null)
          setEditMember("")
          setEditScore("")
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
        {members.map((entry, index) => (
          <div key={`${entry.member}-${index}`} className="rounded-sm border bg-muted/30 p-2 group">
            {editingIndex === index ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editMember}
                  onChange={(e) => setEditMember(e.target.value)}
                  className="flex-1 h-8 text-sm font-mono"
                  placeholder="Member"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(index)
                    if (e.key === "Escape") handleCancelEdit()
                  }}
                />
                <Input
                  type="number"
                  value={editScore}
                  onChange={(e) => setEditScore(e.target.value)}
                  className="w-24 h-8 text-sm font-mono"
                  placeholder="Score"
                  step="any"
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
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={entry.member}
                  disabled
                  className="flex-1 h-8 text-sm font-mono bg-transparent border-0"
                />
                <Input
                  type="number"
                  value={entry.score}
                  disabled
                  className="w-24 h-8 text-sm font-mono bg-transparent border-0 text-right"
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
                  onClick={() => handleDeleteMember(entry.member)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-sm border bg-muted/30 p-3">
        <p className="text-xs text-muted-foreground mb-2">Add New Member</p>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Member..."
            value={newMember}
            onChange={(e) => setNewMember(e.target.value)}
            className="flex-1 h-8 text-sm font-mono"
          />
          <Input
            type="number"
            placeholder="Score"
            value={newScore}
            onChange={(e) => setNewScore(e.target.value)}
            className="w-24 h-8 text-sm font-mono"
            step="any"
          />
          <Button
            size="sm"
            className="h-8 px-3"
            onClick={handleAddMember}
            disabled={isPending || !newMember.trim() || !newScore.trim()}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
