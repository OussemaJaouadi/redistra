"use client"

import { Database, Pulse } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface ConnectionStatsProps {
    totalConnections: number
    activeConnections: number
    className?: string
}

export function ConnectionStats({
    totalConnections,
    activeConnections,
    className
}: ConnectionStatsProps) {
    if (totalConnections === 0) return null

    return (
        <div
            className={cn(
                "rounded-sm border border-primary/20 bg-primary/5 p-3",
                className
            )}
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Database className="h-4 w-4 text-primary" />
                    <span>Total Connections</span>
                    <span className="text-base font-semibold text-foreground">{totalConnections}</span>
                </div>
                <div className="h-4 w-px bg-border/60 hidden sm:block" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Pulse className="h-4 w-4 text-success" />
                    <span>Active</span>
                    <span className="text-base font-semibold text-foreground">{activeConnections}</span>
                </div>
                <div className="ml-auto text-[11px] text-muted-foreground">
                    {activeConnections} / {totalConnections} reachable
                </div>
            </div>
        </div>
    )
}
