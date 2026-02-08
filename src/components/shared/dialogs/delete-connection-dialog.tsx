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
import { Warning, Plug, Database } from "@phosphor-icons/react"
import type { Connection } from "@/types"

interface DeleteConnectionDialogProps {
    connection: Connection | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    isPending?: boolean
}

export function DeleteConnectionDialog({
    connection,
    open,
    onOpenChange,
    onConfirm,
    isPending,
}: DeleteConnectionDialogProps) {
    if (!connection) return null

    const hostLabel = `${connection.host}:${connection.port}`

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
                                <DialogTitle className="text-destructive">Delete Connection</DialogTitle>
                                <DialogDescription>
                                    This action is permanent and cannot be undone.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-4">
                    <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-2">
                                <Plug className="h-3.5 w-3.5" />
                                Connection
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-sm border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                                <Database className="h-3 w-3" />
                                DB {connection.database}
                            </span>
                        </div>
                        <div className="mt-2">
                            <p className="text-sm font-semibold text-foreground">{connection.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{hostLabel}</p>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Deleting this connection will remove saved credentials and history. You can reconnect by adding it again.
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
                        {isPending ? "Deleting..." : "Delete Connection"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
