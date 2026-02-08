"use client"

import { useState } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PencilSimple } from "@phosphor-icons/react"
import type { User, UserRole } from "@/types"

interface EditUserDialogProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: { username: string; role: UserRole }) => void
    isPending?: boolean
}

export function EditUserDialog({ user, open, onOpenChange, onSubmit, isPending }: EditUserDialogProps) {
    const [username, setUsername] = useState(() => user?.username ?? "")
    const [role, setRole] = useState<UserRole>(() => user?.role ?? "viewer")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim()) return
        onSubmit({ username: username.trim(), role })
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="lg" className="p-0 overflow-hidden border-border/80">
                <form onSubmit={handleSubmit}>
                    <div className="bg-secondary/5 border-b border-secondary/20">
                        <DialogHeader className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-secondary">
                                <PencilSimple className="size-24 rotate-12" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex p-2 rounded-lg bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20">
                                    <PencilSimple className="size-6" weight="bold" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <DialogTitle>Edit User</DialogTitle>
                                    <DialogDescription className="text-foreground/60">
                                        Update details for <span className="text-foreground font-semibold italic">{user.username}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="space-y-5 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-username">Username</Label>
                                <Input
                                    id="edit-username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="h-10 bg-background focus-visible:border-secondary/60 focus-visible:ring-secondary/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                                    <SelectTrigger className="h-10 focus-visible:border-secondary/60 focus-visible:ring-secondary/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="editor">Editor</SelectItem>
                                        <SelectItem value="viewer">Viewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-muted/10 border-t border-border/80 p-6 flex justify-between items-center w-full">
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
                            type="submit"
                            disabled={isPending || !username.trim()}
                            className="h-11 px-8 bg-secondary/80 hover:bg-secondary/90 text-secondary-foreground font-semibold shadow-lg shadow-secondary/20 transition-all active:scale-95"
                        >
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
