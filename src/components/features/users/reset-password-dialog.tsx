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
import { Key } from "@phosphor-icons/react"
import type { User } from "@/types"

interface ResetPasswordDialogProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (password: string) => void
    isPending?: boolean
}

export function ResetPasswordDialog({ user, open, onOpenChange, onSubmit, isPending }: ResetPasswordDialogProps) {
    const [password, setPassword] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!password.trim()) return
        onSubmit(password)
        setPassword("")
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="sm" className="p-0 overflow-hidden border-border/80">
                <form onSubmit={handleSubmit}>
                    <div className="bg-warning/5 border-b border-warning/20">
                        <DialogHeader className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-warning">
                                <Key className="size-20 rotate-12" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex p-2 rounded-lg bg-warning text-warning-foreground shadow-lg shadow-warning/20">
                                    <Key className="size-6" weight="bold" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <DialogTitle>Reset Password</DialogTitle>
                                    <DialogDescription className="text-foreground/60">
                                        Set a new password for <span className="text-foreground font-semibold italic">{user.username}</span>
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                autoFocus
                                className="h-10 bg-background focus-visible:border-warning/60 focus-visible:ring-warning/30"
                            />
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
                            disabled={isPending || !password.trim()}
                            className="h-11 px-8 bg-warning/80 hover:bg-warning/90 text-warning-foreground font-semibold shadow-lg shadow-warning/20 transition-all active:scale-95"
                        >
                            {isPending ? "Resetting..." : "Reset Password"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
