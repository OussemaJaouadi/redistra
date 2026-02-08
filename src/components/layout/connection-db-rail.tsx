"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChartLineUp, Key, StackSimple } from "@phosphor-icons/react"
import { useRedisDatabases } from "@/lib/api/hooks/redis"
import type { ListDatabasesResponseDto } from "@/types"

const DATABASES = Array.from({ length: 16 }, (_, index) => index)

interface ConnectionDbRailProps {
    connectionId: string
}

export function ConnectionDbRail({ connectionId }: ConnectionDbRailProps) {
    const { data, isLoading } = useRedisDatabases(connectionId)
    const databases =
        data?.data?.databases || (data as ListDatabasesResponseDto | undefined)?.databases || []
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const activeDbParam = searchParams.get("db")
    const activeDb = activeDbParam ? Number(activeDbParam) : 0
    const isOverview = pathname.endsWith(`/connections/${connectionId}`)
    const dbItems = databases.length
        ? databases
        : DATABASES.map((db) => ({ number: db, keyCount: 0 }))

    return (
        <aside className="hidden lg:flex w-52 flex-col gap-4 border-l bg-card/90 px-4 py-4">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
                <span>Databases</span>
                <span className="font-semibold">{DATABASES.length}</span>
            </div>

            <div className="space-y-2">
                <Link
                    href={`/connections/${connectionId}`}
                    className={cn(
                        "flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-semibold transition-colors",
                        isOverview
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                    title="Overview"
                >
                    <ChartLineUp className="h-4 w-4" />
                    Overview
                </Link>
                <Link
                    href={`/connections/${connectionId}/keys?db=${activeDb}`}
                    className={cn(
                        "flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-semibold transition-colors",
                        !isOverview
                            ? "border-secondary/30 bg-secondary/10 text-secondary"
                            : "border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                    title={`Keys (DB${activeDb})`}
                >
                    <Key className="h-4 w-4" />
                    Keys DB{activeDb}
                </Link>
            </div>

            <div className="rounded-sm border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                Active database{" "}
                <span className="font-semibold text-foreground">DB{activeDb}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                <StackSimple className="h-3.5 w-3.5" />
                <span>All DBs</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {dbItems.map((db: { number: number; keyCount?: number }) => {
                    const keyCount = db.keyCount ?? 0
                    const hasKeys = keyCount > 0

                    return (
                    <Link
                        key={db.number}
                        href={`/connections/${connectionId}/keys?db=${db.number}`}
                        className={cn(
                            "flex h-10 items-center justify-between rounded-sm border px-3 text-xs font-semibold transition-colors",
                            !isOverview && activeDb === db.number
                                ? "border-secondary/30 bg-secondary/10 text-secondary"
                                : hasKeys
                                ? "border-success/30 bg-success/5 text-foreground"
                                : "border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                        title={`Database ${db.number}`}
                    >
                        <span>DB{db.number}</span>
                        <span className={cn("text-[10px]", hasKeys ? "text-success" : "text-muted-foreground")}>
                            {isLoading ? "…" : keyCount.toLocaleString()}
                        </span>
                    </Link>
                )})}
            </div>
        </aside>
    )
}
