"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Warning } from "@phosphor-icons/react"
import type { User } from "@/types"

interface DeleteUserDialogProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isPending?: boolean
}

export function DeleteUserDialog({ user, open, onOpenChange, onConfirm, isPending }: DeleteUserDialogProps) {
    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="sm" className="p-0 overflow-hidden border-destructive/20">
                <div className="bg-destructive/10 border-b border-destructive/20">
                    <DialogHeader className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                            <Warning className="size-16" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex p-2 rounded-lg bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20">
                                <Warning className="size-5" weight="bold" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <DialogTitle className="text-destructive">Delete User</DialogTitle>
                                <DialogDescription>
                                    This action is permanent and cannot be undone.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Are you sure you want to delete <strong>{user.username}</strong>?
                        The user will lose all access to the dashboard immediately.
                    </p>
                </div>

                <DialogFooter className="bg-destructive/5 border-t border-destructive/20 p-6 flex justify-between items-center w-full">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="h-11 border-border/80 bg-background/50 hover:bg-muted/40 transition-all active:scale-95 px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="h-11 px-8 shadow-lg shadow-destructive/10 transition-all active:scale-95"
                    >
                        {isPending ? "Deleting..." : "Delete User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
