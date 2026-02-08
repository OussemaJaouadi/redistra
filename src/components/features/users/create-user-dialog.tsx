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
import { toast } from "@/lib/toast"
import type { UserRole } from "@/types"

interface CreateUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: { username: string; password: string; role: UserRole }) => void
    isPending?: boolean
}

import { UserPlus, FloppyDisk, X, Eye, EyeSlash } from "@phosphor-icons/react"

export function CreateUserDialog({ open, onOpenChange, onSubmit, isPending }: CreateUserDialogProps) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState<UserRole>("viewer")

    const roleDescriptions: Record<UserRole, string> = {
        admin: "Full system access",
        editor: "Can manage keys and connections",
        viewer: "Read-only access",
    }

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setUsername("")
            setPassword("")
            setRole("viewer")
            setShowPassword(false)
        }
        onOpenChange(nextOpen)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!username.trim() || !password.trim()) {
            toast.fail("Username and password are required")
            return
        }
        onSubmit({ username: username.trim(), password, role })
        setUsername("")
        setPassword("")
        setRole("viewer")
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent size="lg" className="p-0 overflow-hidden border-border/80">
                <form onSubmit={handleSubmit}>
                    <div className="bg-success/5 border-b border-success/20">
                        <DialogHeader className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-success">
                                <UserPlus className="size-24 rotate-12" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex p-2 rounded-lg bg-success text-success-foreground shadow-lg shadow-success/20">
                                    <UserPlus className="size-6" weight="bold" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <DialogTitle>Create New User</DialogTitle>
                                    <DialogDescription className="text-foreground/60">Add a new account to the management system.</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="space-y-6 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    autoFocus
                                    className="h-10 bg-background focus-visible:border-success/60 focus-visible:ring-success/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Initial Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="h-10 pr-10 bg-background focus-visible:border-success/60 focus-visible:ring-success/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    >
                                        {showPassword ? (
                                            <EyeSlash size={16} weight="light" />
                                        ) : (
                                            <Eye size={16} weight="light" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">System Role</Label>
                            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                                <SelectTrigger className="h-10 w-full focus-visible:border-success/60 focus-visible:ring-success/30">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">{roleDescriptions[role]}</p>
                        </div>
                    </div>

                    <DialogFooter className="bg-muted/10 border-t border-border/80 p-6 flex justify-between items-center w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                            className="h-11 border-border/80 bg-background/50 hover:bg-muted/40 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 px-6"
                        >
                            <X size={18} weight="light" />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || !username.trim() || !password.trim()}
                            className="h-11 px-8 bg-success/80 hover:bg-success/90 text-success-foreground font-bold shadow-lg shadow-success/20 backdrop-blur-md transition-all active:scale-95 flex items-center gap-2"
                        >
                            <FloppyDisk size={18} weight="bold" />
                            {isPending ? "Creating..." : "Create User"}
                        </Button>
                    </DialogFooter>

                </form>
            </DialogContent>
        </Dialog>
    )
}
