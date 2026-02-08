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
import { Badge } from "@/components/ui/badge"
import { User, Shield, Calendar, Clock, CopySimple } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"
import type { User as UserType } from "@/types"

interface ViewUserDialogProps {
    user: UserType | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewUserDialog({ user, open, onOpenChange }: ViewUserDialogProps) {
    if (!user) return null

    const roleColors = {
        admin: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/40",
        editor: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/40",
        viewer: "bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/40",
    }

    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(user.id)
            toast.info("User ID copied")
        } catch {
            toast.fail("Failed to copy user ID")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="lg" className="p-0 overflow-hidden border-border/80">
                <div className="bg-secondary/5 border-b border-secondary/20">
                    <DialogHeader className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-secondary">
                            <User className="size-24 rotate-12" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex p-2 rounded-lg bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20">
                                <User className="size-6" weight="bold" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <DialogTitle>User Details</DialogTitle>
                                <DialogDescription className="text-foreground/60">View user information</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="space-y-6 p-6">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-sm border border-secondary/20 bg-secondary/10 flex items-center justify-center text-xl font-bold text-secondary">
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">{user.username}</h3>
                            <Badge className={cn("mt-1 border", roleColors[user.role])}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                        <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3 space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                <span>Status</span>
                            </div>
                            <p className={cn(
                                "font-semibold",
                                user.isActive ? "text-success" : "text-muted-foreground"
                            )}>
                                {user.isActive ? "Active" : "Disabled"}
                            </p>
                        </div>

                        <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3 space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Created</span>
                            </div>
                            <p className="font-semibold">
                                {user.createdAt 
                                    ? new Date(user.createdAt).toLocaleDateString() 
                                    : "N/A"
                                }
                            </p>
                        </div>

                        <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3 space-y-1">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Last Login</span>
                            </div>
                            <p className="font-semibold">
                                {user.lastLoginAt 
                                    ? new Date(user.lastLoginAt).toLocaleString() 
                                    : "Never"
                                }
                            </p>
                        </div>
                    </div>

                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">User ID</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={handleCopyId}
                                className="h-7 px-2 text-xs"
                            >
                                <CopySimple className="mr-1 h-3.5 w-3.5" />
                                Copy
                            </Button>
                        </div>
                        <code className="text-xs font-mono text-foreground/80 break-all">
                            {user.id}
                        </code>
                    </div>
                </div>

                <DialogFooter className="bg-muted/10 border-t border-border/80 p-6 flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11 px-6">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
