"use client"

import { useMemo, useState } from "react"
import { toast } from "@/lib/toast"
import type { GetKeyResponseDto } from "@/types"
import { useRedisKey, useUpdateRedisKey } from "@/lib/api/hooks/redis"
import { useQueryClient } from "@tanstack/react-query"

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { HashEditor } from "./editors/hash-editor"
import { ListEditor } from "./editors/list-editor"
import { SetEditor } from "./editors/set-editor"
import { ZSetEditor } from "./editors/zset-editor"

interface KeyEditorSheetProps {
    connectionId: string
    keyName: string | null
    database: number
    open: boolean
    onOpenChange: (open: boolean) => void
}

function formatTtl(ttl?: number) {
    if (ttl === undefined) {
        return "No TTL"
    }

    if (ttl <= 0) {
        return "Expired"
    }

    if (ttl < 60) {
        return `${ttl}s`
    }

    if (ttl < 3600) {
        return `${Math.round(ttl / 60)}m`
    }

    if (ttl < 86400) {
        return `${Math.round(ttl / 3600)}h`
    }

    return `${Math.round(ttl / 86400)}d`
}

function formatBytes(bytes?: number) {
    if (!bytes && bytes !== 0) {
        return "—"
    }

    if (bytes < 1024) {
        return `${bytes} B`
    }

    const kb = bytes / 1024
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`
    }

    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
}

function getTypeBadgeClass(type?: string) {
    // Redis CLI inspired colors
    switch (type) {
        case "string":
            return "border-[#fbbf24]/40 text-[#fbbf24] bg-[#fbbf24]/10"  // Gold
        case "hash":
            return "border-[#60a5fa]/40 text-[#60a5fa] bg-[#60a5fa]/10"  // Blue
        case "list":
            return "border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/10"  // Green
        case "set":
            return "border-[#c084fc]/40 text-[#c084fc] bg-[#c084fc]/10"  // Purple
        case "zset":
            return "border-[#fb923c]/40 text-[#fb923c] bg-[#fb923c]/10"  // Orange
        case "stream":
            return "border-[#22d3ee]/40 text-[#22d3ee] bg-[#22d3ee]/10"  // Cyan
        default:
            return "border-border text-muted-foreground"
    }
}

export function KeyEditorSheet({
    connectionId,
    keyName,
    database,
    open,
    onOpenChange,
}: KeyEditorSheetProps) {
    const queryClient = useQueryClient()
    const { data, isLoading } = useRedisKey(connectionId, keyName || "", database)
    const keyDetails = data?.data?.key || (data as GetKeyResponseDto | undefined)?.key
    const value = data?.data?.value ?? (data as GetKeyResponseDto | undefined)?.value
    const { mutate: updateKey, isPending } = useUpdateRedisKey(connectionId, keyName || "", database)

    const [draftValue, setDraftValue] = useState<string | null>(null)
    const resolvedDraftValue =
        draftValue ?? (keyDetails?.type === "string" && typeof value === "string" ? value : "")

    const readableValue = useMemo(() => {
        if (keyDetails?.type === "string") {
            return null
        }

        try {
            return JSON.stringify(value, null, 2)
        } catch {
            return String(value ?? "")
        }
    }, [keyDetails?.type, value])

    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        if (!readableValue) {
            return
        }

        try {
            await navigator.clipboard.writeText(readableValue)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.info("Copied to clipboard")
        } catch {
            toast.fail("Failed to copy")
        }
    }

    const handleSave = () => {
        if (!keyName || keyDetails?.type !== "string") {
            return
        }

        updateKey(
            { value: resolvedDraftValue, db: database },
            {
                onSuccess: () => {
                    toast.success("Key updated")
                },
                onError: (error: unknown) => {
                    toast.fail(error instanceof Error ? error.message : "Failed to update key")
                },
            }
        )
    }

    if (!keyName) {
        return null
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-[900px] lg:max-w-[1100px] w-full px-6">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <span className="truncate">{keyName}</span>
                        {keyDetails?.type && (
                            <Badge variant="outline" className={cn("text-xs uppercase", getTypeBadgeClass(keyDetails.type))}>
                                {keyDetails.type}
                            </Badge>
                        )}
                    </SheetTitle>
                    <SheetDescription>
                        Inspect and edit the selected Redis key.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6 pb-6">
                    <div className="grid grid-cols-3 gap-4 rounded-sm border bg-muted/30 p-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">TTL</p>
                            <p className="font-medium">{formatTtl(keyDetails?.ttl)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">{formatBytes(keyDetails?.size)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Length</p>
                            <p className="font-medium">{keyDetails?.length ?? "—"}</p>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="rounded-sm border border-dashed p-6 text-center text-sm text-muted-foreground">
                            Loading key details...
                        </div>
                    )}

                    {!isLoading && keyDetails?.type === "string" && (
                        <div className="space-y-3 rounded-sm border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Value</p>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isPending}
                                >
                                    {isPending ? "Saving..." : "Save"}
                                </Button>
                            </div>
                            <Textarea
                                className="min-h-[240px] w-full rounded-sm p-3 font-mono text-xs"
                                value={resolvedDraftValue}
                                onChange={(event) => setDraftValue(event.target.value)}
                            />
                        </div>
                    )}

                    {!isLoading && keyDetails?.type === "hash" && (
                        <div className="space-y-4 rounded-sm border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Value</p>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCopy} 
                                    disabled={!readableValue}
                                    className={cn(
                                        "transition-all duration-200",
                                        copied && "bg-success/20 border-success/50 text-success"
                                    )}
                                >
                                    {copied ? "Copied!" : "Copy JSON"}
                                </Button>
                            </div>
                            <HashEditor 
                                key={`${keyName}-${database}-hash`}
                                connectionId={connectionId} 
                                keyName={keyName} 
                                database={database}
                                value={value as Record<string, string>} 
                                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys', keyName, database] })}
                            />
                        </div>
                    )}

                    {!isLoading && keyDetails?.type === "list" && (
                        <div className="space-y-4 rounded-sm border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Value</p>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCopy} 
                                    disabled={!readableValue}
                                    className={cn(
                                        "transition-all duration-200",
                                        copied && "bg-success/20 border-success/50 text-success"
                                    )}
                                >
                                    {copied ? "Copied!" : "Copy JSON"}
                                </Button>
                            </div>
                            <ListEditor 
                                key={`${keyName}-${database}-list`}
                                connectionId={connectionId} 
                                keyName={keyName} 
                                database={database}
                                value={value as { items: string[] }} 
                                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys', keyName, database] })}
                            />
                        </div>
                    )}

                    {!isLoading && keyDetails?.type === "set" && (
                        <div className="space-y-4 rounded-sm border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Value</p>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCopy} 
                                    disabled={!readableValue}
                                    className={cn(
                                        "transition-all duration-200",
                                        copied && "bg-success/20 border-success/50 text-success"
                                    )}
                                >
                                    {copied ? "Copied!" : "Copy JSON"}
                                </Button>
                            </div>
                            <SetEditor 
                                key={`${keyName}-${database}-set`}
                                connectionId={connectionId} 
                                keyName={keyName} 
                                database={database}
                                value={value as { members: string[] }} 
                                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys', keyName, database] })}
                            />
                        </div>
                    )}

                    {!isLoading && keyDetails?.type === "zset" && (
                        <div className="space-y-4 rounded-sm border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Value</p>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCopy} 
                                    disabled={!readableValue}
                                    className={cn(
                                        "transition-all duration-200",
                                        copied && "bg-success/20 border-success/50 text-success"
                                    )}
                                >
                                    {copied ? "Copied!" : "Copy JSON"}
                                </Button>
                            </div>
                            <ZSetEditor 
                                key={`${keyName}-${database}-zset`}
                                connectionId={connectionId} 
                                keyName={keyName} 
                                database={database}
                                value={value as { members: Array<{ member: string; score: number }> }} 
                                onUpdate={() => queryClient.invalidateQueries({ queryKey: ['redis', connectionId, 'keys', keyName, database] })}
                            />
                        </div>
                    )}

                    {!isLoading && keyDetails?.type === "stream" && (
                        <div className="space-y-4 rounded-sm border bg-card p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Value</p>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={handleCopy} 
                                    disabled={!readableValue}
                                    className={cn(
                                        "transition-all duration-200",
                                        copied && "bg-success/20 border-success/50 text-success"
                                    )}
                                >
                                    {copied ? "Copied!" : "Copy JSON"}
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {(value as { entries: Array<{ id: string; fields: Record<string, string> }> }).entries?.map((entry) => (
                                    <div key={entry.id} className="rounded-sm border bg-muted/30 p-3">
                                        <p className="text-xs font-medium text-muted-foreground">ID {entry.id}</p>
                                        <div className="mt-2 space-y-1">
                                            {Object.entries(entry.fields || {}).map(([field, fieldValue]) => (
                                                <div key={`${entry.id}-${field}`} className="flex items-start justify-between gap-3 text-xs font-mono">
                                                    <span className="break-all">{field}</span>
                                                    <span className="break-all text-muted-foreground">{fieldValue}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Stream editing is not yet supported.
                            </p>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
