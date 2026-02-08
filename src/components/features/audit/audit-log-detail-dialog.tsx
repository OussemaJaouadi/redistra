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
import { Eye } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import type { AuditLog } from "@/types"

interface AuditLogDetailDialogProps {
    log: AuditLog | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const actionColors: Record<string, string> = {
    "auth.login": "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/40",
    "auth.login_failed": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/40",
    "auth.logout": "bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/40",
    "user.created": "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/40",
    "user.updated": "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/40",
    "user.deleted": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/40",
    "connection.created": "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/40",
    "connection.updated": "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/40",
    "connection.deleted": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/40",
    "key.created": "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/40",
    "key.updated": "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/40",
    "key.deleted": "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/40",
    "database.flushed": "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/40",
}

function getActionBadgeClass(action: string) {
    return actionColors[action] || "bg-muted text-muted-foreground border-muted-foreground/40"
}

function formatAction(action: string) {
    return action.replace(/\./g, " ").replace(/_/g, " ").toLowerCase()
}

export function AuditLogDetailDialog({ log, open, onOpenChange }: AuditLogDetailDialogProps) {
    if (!log) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="xl" className="p-0 overflow-hidden border-border/80">
                <div className="bg-muted/10 border-b border-border/80">
                    <DialogHeader className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-primary">
                            <Eye className="size-24 rotate-12" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex p-2 rounded-lg bg-background border border-border/80 shadow-sm text-primary">
                                <Eye className="size-6" weight="bold" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <DialogTitle>Audit Log Details</DialogTitle>
                                <DialogDescription className="text-foreground/60">
                                    Detailed trace and metadata for this operation.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Timestamp</p>
                            <p className="text-sm font-semibold">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Operator</p>
                            <div className="flex items-center gap-2">
                                <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                                    {(log.username || "S").charAt(0).toUpperCase()}
                                </div>
                                <p className="text-sm font-semibold">{log.username || log.userId || "System"}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Action Event</p>
                            <Badge className={cn("mt-1 font-mono text-[10px] border-2", getActionBadgeClass(log.action))}>
                                {formatAction(log.action)}
                            </Badge>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">IP Address</p>
                            <code className="text-sm bg-muted/40 px-2 py-0.5 rounded font-mono border border-border/80">{log.ipAddress}</code>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Resource Type</p>
                            <p className="text-sm font-semibold capitalize">{log.resourceType}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest">Resource Name</p>
                            <p className="text-sm font-bold truncate text-primary" title={log.resourceName}>{log.resourceName || "—"}</p>
                        </div>
                    </div>

                    {log.details && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Activity Summary</p>
                                <Badge variant="secondary" className="text-[10px] font-normal opacity-70">Readable View</Badge>
                            </div>
                            <div className="grid gap-3 p-4 rounded-xl border border-border/80 bg-muted/40">
                                {Object.entries(JSON.parse(log.details)).map(([key, value]) => (
                                    <div key={key} className="flex items-baseline justify-between gap-4 border-b border-border p-1.5 last:border-0 last:pb-0 hover:bg-muted/30 transition-colors rounded-sm">
                                        <span className="text-xs font-bold text-muted-foreground/90 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className="text-xs font-mono font-bold break-all text-right max-w-[60%] text-foreground">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-muted/10 border-t border-border/80">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6 border-border/80">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
