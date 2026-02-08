"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Trash,
    PencilSimple,
    PlugsConnected,
    Pulse
} from "@phosphor-icons/react"
import { DotsThreeVertical } from "@phosphor-icons/react"
import type { Connection } from "@/types"
import { EmptyConnectionState } from "./empty-connection-state"
import { useRouter } from "next/navigation"
import { useTestExistingConnection } from "@/lib/api/hooks/connections"
import { useState } from "react"
import { toast } from "@/lib/toast"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, CaretDown, CaretUp } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface ConnectionsTableProps {
    connections: Connection[]
    onDelete?: (id: string) => void
    onEdit?: (connection: Connection) => void
}

type ConnectionsPayload = {
    connections?: {
        my?: Connection[]
        shared?: Connection[]
    }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null

function getRelativeTime(date: Date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const diff = (date.getTime() - new Date().getTime()) / 1000;
    const absDiff = Math.abs(diff);

    if (absDiff < 60) return rtf.format(Math.round(diff), 'second');
    if (absDiff < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (absDiff < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    return rtf.format(Math.round(diff / 86400), 'day');
}

export function ConnectionsTable({
    connections,
    onDelete,
    onEdit
}: ConnectionsTableProps) {
    const router = useRouter()
    const { mutate: testConnection } = useTestExistingConnection()
    const [testingId, setTestingId] = useState<string | null>(null)
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortKey, setSortKey] = useState<"lastUsed" | "created" | null>(null)
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
    const [pageSize, setPageSize] = useState(25)
    const [page, setPage] = useState(1)

    if (!connections?.length) {
        return <EmptyConnectionState onCreateClick={() => { }} />
        // Note: The parent component should handle the actual creation trigger, 
        // potentially bypassing this onCreateClick if using a global modal state.
        // For now, we'll assume the page handles the empty state logic or passes it down.
    }

    const getStatus = (connection: Connection) => {
        if (connection.lastStatus === "connected") return "active"
        if (connection.lastStatus === "error") return "error"
        return "inactive"
    }

    const filtered = connections.filter((connection) => {
        const nameMatch = connection.name.toLowerCase().includes(search.trim().toLowerCase())
        if (!nameMatch) return false
        if (statusFilter === "all") return true
        return getStatus(connection) === statusFilter
    })

    const sorted = [...filtered].sort((a, b) => {
        if (!sortKey) return 0
        const aDate = sortKey === "lastUsed" ? a.lastUsed : a.createdAt
        const bDate = sortKey === "lastUsed" ? b.lastUsed : b.createdAt
        const aTime = aDate ? new Date(aDate).getTime() : -Infinity
        const bTime = bDate ? new Date(bDate).getTime() : -Infinity
        const diff = aTime - bTime
        return sortDir === "asc" ? diff : -diff
    })

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const startIndex = (currentPage - 1) * pageSize
    const pageItems = sorted.slice(startIndex, startIndex + pageSize)

    const handleSort = (key: "lastUsed" | "created") => {
        if (sortKey !== key) {
            setSortKey(key)
            setSortDir("desc")
            return
        }

        setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
    }

    const handleConnect = (id: string) => {
        router.push(`/connections/${id}`)
    }

    const updateLastStatus = (id: string, status: Connection["lastStatus"]) => {
        queryClient.setQueryData(['connections'], (old: unknown) => {
            if (!isRecord(old)) {
                return old
            }

            const hasDataWrapper = "data" in old && isRecord(old.data)
            const data = (hasDataWrapper ? old.data : old) as ConnectionsPayload
            const connectionsGroup = data.connections
            if (!connectionsGroup) {
                return old
            }

            const updateList = (items: Connection[]) =>
                items.map((connection) =>
                    connection.id === id ? { ...connection, lastStatus: status } : connection
                )

            const updated = {
                ...data,
                connections: {
                    ...connectionsGroup,
                    my: updateList(connectionsGroup.my || []),
                    shared: updateList(connectionsGroup.shared || []),
                },
            }

            return hasDataWrapper ? { ...old, data: updated } : { ...old, ...updated }
        })
    }

    const handleTest = (id: string) => {
        setTestingId(id)
        testConnection(id, {
            onSuccess: (result: unknown) => {
                let latency: number | undefined
                if (isRecord(result)) {
                    if ("data" in result && isRecord(result.data) && typeof result.data.latencyMs === "number") {
                        latency = result.data.latencyMs
                    } else if (typeof result.latencyMs === "number") {
                        latency = result.latencyMs
                    }
                }
                toast.success(latency ? `Connection OK (${latency} ms)` : "Connection OK")
                updateLastStatus(id, "connected")
            },
            onError: (error: unknown) => {
                toast.fail(error instanceof Error ? error.message : "Connection test failed")
                updateLastStatus(id, "error")
            },
            onSettled: () => {
                setTestingId(null)
            },
        })
    }

    return (
        <div className="rounded-md border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-3 py-2">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    <Input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value)
                            setPage(1)
                        }}
                        placeholder="Filter by name..."
                        className="h-8 w-48 bg-background/70"
                    />
                    <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                            setStatusFilter(value)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger size="sm" className="h-8">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Rows</span>
                    <Select
                        value={String(pageSize)}
                        onValueChange={(value) => {
                            setPageSize(Number(value))
                            setPage(1)
                        }}
                    >
                        <SelectTrigger size="sm" className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/10 px-3 py-2">
                <div className="text-xs text-muted-foreground">
                    {sorted.length > 0 ? (
                        <>
                            Showing <span className="font-semibold text-foreground">{startIndex + 1}</span>-
                            <span className="font-semibold text-foreground">{Math.min(startIndex + pageSize, sorted.length)}</span> of{" "}
                            <span className="font-semibold text-foreground">{sorted.length}</span>
                        </>
                    ) : (
                        "No results"
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                    </Button>
                    {Array.from({ length: totalPages }).map((_, index) => {
                        const pageNumber = index + 1
                        return (
                            <Button
                                key={pageNumber}
                                size="icon-sm"
                                variant={pageNumber === currentPage ? "secondary" : "ghost"}
                                onClick={() => setPage(pageNumber)}
                                className={cn("h-8 w-8", pageNumber === currentPage && "text-foreground")}
                            >
                                {pageNumber}
                            </Button>
                        )
                    })}
                    <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Host</TableHead>
                        <TableHead className="hidden md:table-cell">
                            <button
                                type="button"
                                onClick={() => handleSort("lastUsed")}
                                className="inline-flex items-center gap-1"
                            >
                                Last Used
                                {sortKey === "lastUsed" ? (
                                    sortDir === "asc" ? <CaretUp className="h-3 w-3" /> : <CaretDown className="h-3 w-3" />
                                ) : null}
                            </button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                            <button
                                type="button"
                                onClick={() => handleSort("created")}
                                className="inline-flex items-center gap-1"
                            >
                                Created
                                {sortKey === "created" ? (
                                    sortDir === "asc" ? <CaretUp className="h-3 w-3" /> : <CaretDown className="h-3 w-3" />
                                ) : null}
                            </button>
                        </TableHead>
                        <TableHead className="md:hidden">Time</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageItems.map((connection) => (
                        <TableRow key={connection.id} className="group transition-all duration-150 hover:bg-muted/50 hover:translate-x-0.5 cursor-pointer">
                            <TableCell>
                                {connection.lastStatus === "connected" ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-redis-pulse absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                        </span>
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/40 bg-muted-foreground/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        <span className="h-2 w-2 rounded-full bg-muted-foreground/50"></span>
                                        Inactive
                                    </span>
                                )}
                            </TableCell>
                            <TableCell className="font-medium">
                                <div className="flex flex-col gap-0.5">
                                    <span>{connection.name}</span>
                                    <span className="font-mono text-xs text-muted-foreground md:hidden">
                                        {connection.host}:{connection.port}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                                {connection.host}:{connection.port}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">
                                {connection.lastUsed ? getRelativeTime(new Date(connection.lastUsed)) : '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">
                                {connection.createdAt ? getRelativeTime(new Date(connection.createdAt)) : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground md:hidden">
                                <div className="flex flex-col gap-0.5 text-[11px]">
                                    <span>
                                        Last used {connection.lastUsed ? getRelativeTime(new Date(connection.lastUsed)) : "—"}
                                    </span>
                                    <span>
                                        Created {connection.createdAt ? getRelativeTime(new Date(connection.createdAt)) : "—"}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="hidden justify-end gap-2 md:flex">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-2 border-secondary/40 text-secondary hover:bg-secondary/10 hover:text-secondary"
                                        onClick={() => handleConnect(connection.id)}
                                    >
                                        <PlugsConnected className="h-4 w-4" />
                                        Connect
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8"
                                        onClick={() => handleTest(connection.id)}
                                        disabled={testingId === connection.id}
                                    >
                                        <Pulse className="mr-2 h-4 w-4" />
                                        Test
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8"
                                        onClick={() => onEdit?.(connection)}
                                    >
                                        <PencilSimple className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-destructive hover:text-destructive"
                                        onClick={() => onDelete?.(connection.id)}
                                    >
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                                <div className="flex justify-end gap-2 md:hidden">
                                    <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <DotsThreeVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleConnect(connection.id)}>
                                                <PlugsConnected className="mr-2 h-4 w-4" />
                                                Connect
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleTest(connection.id)}>
                                                <Pulse className="mr-2 h-4 w-4" />
                                                Test
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onEdit?.(connection)}>
                                                <PencilSimple className="mr-2 h-4 w-4" />
                                                Edit Connection
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => onDelete?.(connection.id)}
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {pageItems.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                                No connections match your filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
