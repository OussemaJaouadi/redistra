"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useRedisDatabases, useRedisInfo } from "@/lib/api/hooks/redis"
import { ConnectionHealthSkeleton } from "@/components/skeletons/connection-health-skeleton"
import { ConnectionKpiSkeleton } from "@/components/skeletons/connection-kpi-skeleton"
import { ConnectionDbSkeleton } from "@/components/skeletons/connection-db-skeleton"
import { cn } from "@/lib/utils"
import type { ListDatabasesResponseDto } from "@/types"
import type { RedisInfoResponseDto as RedisInfoDetailsResponseDto } from "@/types/redis.dto"
import {
    Clock,
    Cpu,
    Database,
    Gauge,
    HardDrives,
    Monitor,
    Pulse,
    ShieldCheck,
    Users,
} from "@phosphor-icons/react"

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

export default function ConnectionOverviewPage() {
    const params = useParams()
    const connectionId = Array.isArray(params.connectionId)
        ? params.connectionId[0]
        : params.connectionId
    const { data, isLoading } = useRedisDatabases(connectionId || "")
    const { data: infoResponse, isLoading: isInfoLoading } = useRedisInfo(connectionId || "")
    const databasesResponse = data?.data ?? (data as ListDatabasesResponseDto | undefined)
    const databases = useMemo(() => databasesResponse?.databases ?? [], [databasesResponse])

    const totalKeys = databasesResponse?.totalKeys ?? 0
    const totalMemory = databasesResponse?.totalMemory ?? 0

    const activeDbs = useMemo(() => {
        return databases.filter((db) => db.keyCount > 0)
    }, [databases])

    const sortedDatabases = useMemo(() => {
        return [...databases].sort((a, b) => {
            const aActive = a.keyCount > 0
            const bActive = b.keyCount > 0

            if (aActive !== bActive) {
                return aActive ? -1 : 1
            }

            return a.number - b.number
        })
    }, [databases])

    const infoPayload = infoResponse?.data ?? (infoResponse as unknown as RedisInfoDetailsResponseDto | undefined)
    const info = infoPayload?.info as RedisInfoDetailsResponseDto["info"] | undefined

    const formatUptime = (seconds?: string) => {
        if (!seconds) {
            return "—"
        }

        const totalSeconds = Number(seconds)
        if (Number.isNaN(totalSeconds)) {
            return seconds
        }

        const days = Math.floor(totalSeconds / 86400)
        const hours = Math.floor((totalSeconds % 86400) / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="border rounded-sm bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/50">
                    <h3 className="font-semibold">Server Health</h3>
                </div>
                {isInfoLoading ? (
                    <ConnectionHealthSkeleton />
                ) : (
                    <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 text-sm">
                        <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Database className="h-4 w-4 text-secondary" />
                                <span>Redis Version</span>
                            </div>
                            <p className="mt-2 font-semibold">{info?.server?.redis_version || "—"}</p>
                        </div>
                        <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Monitor className="h-4 w-4 text-secondary" />
                                <span>OS</span>
                            </div>
                            <p className="mt-2 font-semibold">{info?.server?.os || "—"}</p>
                        </div>
                        <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-4 w-4 text-secondary" />
                                <span>Uptime</span>
                            </div>
                            <p className="mt-2 font-semibold">{formatUptime(info?.server?.uptime_in_seconds)}</p>
                        </div>
                        <div className="rounded-sm border border-warning/20 bg-warning/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <HardDrives className="h-4 w-4 text-warning" />
                                <span>Memory Used</span>
                            </div>
                            <p className="mt-2 font-semibold">{info?.memory?.used_memory_human || "—"}</p>
                        </div>
                        <div className="rounded-sm border border-warning/20 bg-warning/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <HardDrives className="h-4 w-4 text-warning" />
                                <span>System Memory</span>
                            </div>
                            <p className="mt-2 font-semibold">{info?.memory?.total_system_memory_human || "—"}</p>
                        </div>
                        <div className="rounded-sm border border-success/20 bg-success/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 text-success" />
                                <span>Health</span>
                            </div>
                            <p className={cn("mt-2 font-semibold", info?.health?.ping === "PONG" ? "text-success" : "text-warning")}>
                                {info?.health?.ping || "—"}
                            </p>
                        </div>
                        <div className="rounded-sm border border-accent/20 bg-accent/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-4 w-4 text-accent" />
                                <span>Connected Clients</span>
                            </div>
                            <p className="mt-2 font-semibold">{info?.clients?.connected_clients || "—"}</p>
                        </div>
                        <div className="rounded-sm border border-accent/20 bg-accent/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Gauge className="h-4 w-4 text-accent" />
                                <span>Ops/sec</span>
                            </div>
                            <p className="mt-2 font-semibold">{info?.stats?.instantaneous_ops_per_sec || "—"}</p>
                        </div>
                        <div className="rounded-sm border border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Cpu className="h-4 w-4 text-primary" />
                                <span>Role</span>
                            </div>
                            <p className={cn("mt-2 font-semibold", info?.replication?.role === "master" ? "text-primary" : "text-accent")}>
                                {info?.replication?.role || "—"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {isLoading ? (
                <ConnectionKpiSkeleton />
            ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-sm border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Database className="h-4 w-4 text-primary" />
                            <span>Total Keys</span>
                        </div>
                        <p className="mt-2 text-xl font-semibold">{totalKeys.toLocaleString()}</p>
                    </div>
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <HardDrives className="h-4 w-4 text-secondary" />
                            <span>Total Memory</span>
                        </div>
                        <p className="mt-2 text-xl font-semibold">{formatBytes(totalMemory)}</p>
                    </div>
                    <div className="rounded-sm border border-success/20 bg-success/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Pulse className="h-4 w-4 text-success" />
                            <span>Active Databases</span>
                        </div>
                        <p className="mt-2 text-xl font-semibold">{activeDbs.length}</p>
                    </div>
                </div>
            )}

            <div className="border rounded-sm bg-card overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/50">
                    <h3 className="font-semibold">Database Usage</h3>
                </div>
                {isLoading ? (
                    <ConnectionDbSkeleton />
                ) : (
                    <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {sortedDatabases.length === 0 ? (
                            <div className="col-span-full text-center text-sm text-muted-foreground">
                                No databases reported yet.
                            </div>
                        ) : (
                            sortedDatabases.map((db) => {
                                const isActive = db.keyCount > 0

                                return (
                                    <div
                                        key={db.number}
                                        className={cn(
                                            "rounded-sm border p-3",
                                            isActive ? "border-success/30 bg-success/5" : "border-border/60 bg-muted/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold">DB{db.number}</p>
                                            <span className={cn("text-[11px] font-semibold uppercase tracking-wide", isActive ? "text-success" : "text-muted-foreground")}>
                                                {isActive ? "Active" : "Free"}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Keys</span>
                                            <span className="font-medium">{db.keyCount.toLocaleString()}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Memory</span>
                                            <span className="font-medium">{formatBytes(db.memoryUsage)}</span>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
