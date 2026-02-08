"use client"

import { ConnectionsTable } from "@/components/features/dashboard/connections-table"
import { useConnections, useDeleteConnection } from "@/lib/api/hooks/connections"
import { useSystemHealth } from "@/lib/api/hooks/system"
import { Button } from "@/components/ui/button"
import { Clock, Cpu, Database, HardDrives, Monitor, Plus, Pulse, TerminalWindow } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"
import type { Connection, ListConnectionsResponseDto, SystemHealthResponseDto } from "@/types"
import { CreateConnectionDialog } from "@/components/shared/dialogs/create-connection-dialog"
import { EditConnectionDialog } from "@/components/shared/dialogs/edit-connection-dialog"
import { DeleteConnectionDialog } from "@/components/shared/dialogs/delete-connection-dialog"
import { useState } from "react"
import { DashboardHeaderActionSkeleton } from "@/components/skeletons/dashboard-header-action-skeleton"
import { DashboardHealthCardsSkeleton } from "@/components/skeletons/dashboard-health-cards-skeleton"
import { DashboardConnectionsTableSkeleton } from "@/components/skeletons/dashboard-connections-table-skeleton"
import { DashboardOsSummarySkeleton } from "@/components/skeletons/dashboard-os-summary-skeleton"
import { DashboardEnvSummarySkeleton } from "@/components/skeletons/dashboard-env-summary-skeleton"
import { DashboardConnectionStatsSkeleton } from "@/components/skeletons/dashboard-connection-stats-skeleton"
import { cn } from "@/lib/utils"


export default function DashboardPage() {
    const { data: connectionsResponse, isLoading: isConnectionsLoading, error: connectionsError } = useConnections()
    const { mutate: deleteConnection, isPending: isDeletingConnection } = useDeleteConnection()
    const { data: healthResponse, isLoading: isHealthLoading, error: healthError } = useSystemHealth()
    const [editingConnection, setEditingConnection] = useState<Connection | null>(null)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)

    // Handle potential API response inconsistencies (wrapped in .data vs flat)
    const connectionsPayload: ListConnectionsResponseDto | undefined =
        connectionsResponse?.data ?? (connectionsResponse as ListConnectionsResponseDto | undefined)
    const connectionsGroup = connectionsPayload?.connections
    const connections = connectionsGroup ? [...(connectionsGroup.my || []), ...(connectionsGroup.shared || [])] : []

    // Calculate stats
    const totalConnections = connections.length
    const activeConnections = connections.filter((connection) => connection.lastStatus === "connected").length

    const healthPayload: SystemHealthResponseDto | undefined =
        healthResponse?.data ?? (healthResponse as SystemHealthResponseDto | undefined)
    const healthInfo = healthPayload?.info
    const formatUptime = (seconds?: number) => {
        if (!seconds && seconds !== 0) {
            return "—"
        }

        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        return `${days}d ${hours}h ${minutes}m`
    }

    const handleDelete = (id: string) => {
        const target = connections.find((connection) => connection.id === id)
        if (!target) {
            toast.fail("Connection not found")
            return
        }
        setDeleteTarget(target)
        setDeleteOpen(true)
    }

    const confirmDelete = () => {
        if (!deleteTarget) return
        deleteConnection(deleteTarget.id, {
            onSuccess: () => {
                toast.success("Connection deleted")
                setDeleteOpen(false)
                setDeleteTarget(null)
            },
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to delete connection"
                toast.fail(message)
            },
        })
    }

    const handleEdit = (connection: Connection) => {
        setEditingConnection(connection)
        setEditOpen(true)
    }

    return (
        <div className="flex flex-col gap-4 animate-in fade-in-50">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your Redis connections and monitor performance.</p>
                </div>
                {isConnectionsLoading ? (
                    <DashboardHeaderActionSkeleton />
                ) : connections.length > 0 ? (
                    <CreateConnectionDialog
                        trigger={
                            <Button className="h-11 gap-2 px-5">
                                <Plus className="h-4 w-4" />
                                New Connection
                            </Button>
                        }
                    />
                ) : null}
            </div>

            {isHealthLoading ? (
                <DashboardHealthCardsSkeleton />
            ) : healthError ? (
                <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    Failed to load system health.
                </div>
            ) : (
                <>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-sm border bg-secondary/5 border-secondary/20 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="h-4 w-4 text-secondary" />
                                    <span>Uptime</span>
                                </div>
                                <span className="text-[11px] text-muted-foreground">{healthInfo?.os?.hostname || "—"}</span>
                            </div>
                            <p className="mt-1 text-lg font-semibold">{formatUptime(healthInfo?.process?.uptimeSeconds)}</p>
                        </div>
                        <div className="rounded-sm border bg-warning/5 border-warning/20 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Cpu className="h-4 w-4 text-warning" />
                                    <span>CPU Load</span>
                                </div>
                                <span className="text-[11px] text-muted-foreground">{healthInfo?.cpu?.model || "—"}</span>
                            </div>
                            <p className="mt-1 text-lg font-semibold">
                                {healthInfo?.cpu?.loadavg ? healthInfo.cpu.loadavg[0].toFixed(2) : "—"}
                            </p>
                        </div>
                        <div className="rounded-sm border bg-accent/5 border-accent/20 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <HardDrives className="h-4 w-4 text-accent" />
                                    <span>Memory (RSS)</span>
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                    {healthInfo?.memory
                                        ? `Heap ${(healthInfo.memory.heapUsed / (1024 ** 2)).toFixed(0)} / ${(healthInfo.memory.heapTotal / (1024 ** 2)).toFixed(0)} MB`
                                        : "—"}
                                </span>
                            </div>
                            <p className="mt-1 text-lg font-semibold">
                                {healthInfo?.memory
                                    ? `${(healthInfo.memory.rss / (1024 ** 3)).toFixed(2)} GB`
                                    : "—"}
                            </p>
                        </div>
                    </div>

                </>
            )}

            <div className="rounded-sm border bg-card">
                <div className="grid divide-y md:grid-cols-3 md:divide-x md:divide-y-0">
                    {isHealthLoading ? (
                        <DashboardOsSummarySkeleton />
                    ) : healthError ? (
                        <div className="p-3 text-xs text-destructive">OS unavailable</div>
                    ) : (
                        <div className="p-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Monitor className="h-4 w-4 text-muted-foreground" />
                                <span>OS</span>
                            </div>
                            <p className="mt-1 text-sm font-medium">
                                {healthInfo?.os ? `${healthInfo.os.platform} ${healthInfo.os.release}` : "—"}
                            </p>
                        </div>
                    )}
                    {isHealthLoading ? (
                        <DashboardEnvSummarySkeleton />
                    ) : healthError ? (
                        <div className="p-3 text-xs text-destructive">Environment unavailable</div>
                    ) : (
                        <div className="p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <TerminalWindow className="h-4 w-4 text-muted-foreground" />
                                    <span>Environment</span>
                                </div>
                                {(() => {
                                    const env = (healthInfo?.process?.env || "unknown").toLowerCase()
                                    const envStyles =
                                        env === "production"
                                            ? "border-success/30 bg-success/10 text-success"
                                            : env === "development"
                                            ? "border-warning/30 bg-warning/10 text-warning"
                                            : env === "staging"
                                            ? "border-secondary/30 bg-secondary/10 text-secondary"
                                            : "border-border/60 bg-muted/40 text-muted-foreground"
                                    return (
                                        <span
                                            className={cn(
                                                "rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                                envStyles
                                            )}
                                        >
                                            {env}
                                        </span>
                                    )
                                })()}
                            </div>
                        </div>
                    )}
                    {isConnectionsLoading ? (
                        <DashboardConnectionStatsSkeleton />
                    ) : connectionsError ? (
                        <div className="p-3 text-xs text-destructive">Connections unavailable</div>
                    ) : (
                        <div className="p-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Database className="h-4 w-4 text-primary" />
                                    <span>Total</span>
                                    <span className="text-base font-semibold text-foreground">{totalConnections}</span>
                                </div>
                                <div className="h-4 w-px bg-border/60 hidden sm:block" />
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Pulse className="h-4 w-4 text-success" />
                                    <span>Active</span>
                                    <span className="text-base font-semibold text-foreground">{activeConnections}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-2">
                {isConnectionsLoading ? (
                    <DashboardConnectionsTableSkeleton />
                ) : connectionsError ? (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                        Failed to load connections.
                    </div>
                ) : (
                    <ConnectionsTable
                        connections={connections}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />
                )}
            </div>

            <EditConnectionDialog
                connection={editingConnection}
                open={editOpen}
                onOpenChange={(nextOpen) => {
                    setEditOpen(nextOpen)
                    if (!nextOpen) {
                        setEditingConnection(null)
                    }
                }}
            />
            <DeleteConnectionDialog
                connection={deleteTarget}
                open={deleteOpen}
                onOpenChange={(nextOpen) => {
                    setDeleteOpen(nextOpen)
                    if (!nextOpen) {
                        setDeleteTarget(null)
                    }
                }}
                onConfirm={confirmDelete}
                isPending={isDeletingConnection}
            />
        </div>
    );
}
