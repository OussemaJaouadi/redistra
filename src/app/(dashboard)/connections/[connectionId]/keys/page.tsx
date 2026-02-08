"use client"

import { useMemo, useState } from "react"
import { useRedisKeys } from "@/lib/api/hooks/redis"
import type { RedisDataType, RedisKey, ListKeysResponseDto } from "@/types"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { KeyEditorSheet } from "@/components/features/keys/key-editor-sheet"
import { CreateKeyDialog } from "@/components/features/keys/create-key-dialog"
import { RenameKeyDialog } from "@/components/features/keys/rename-key-dialog"
import { DeleteKeyDialog } from "@/components/features/keys/delete-key-dialog"
import { SetTtlDialog } from "@/components/features/keys/set-ttl-dialog"
import { ArrowClockwise, DotsThree, Pencil, Trash, Clock } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const keyTypes: Array<RedisDataType | "all"> = [
    "all",
    "string",
    "hash",
    "list",
    "set",
    "zset",
    "stream",
]

const databases = Array.from({ length: 16 }, (_, index) => index)

// Redis CLI inspired type colors
const typeColors: Record<string, { bg: string; text: string; border: string }> = {
    string: { bg: "bg-[#fbbf24]/10", text: "text-[#fbbf24]", border: "border-[#fbbf24]/40" },
    hash: { bg: "bg-[#60a5fa]/10", text: "text-[#60a5fa]", border: "border-[#60a5fa]/40" },
    list: { bg: "bg-[#4ade80]/10", text: "text-[#4ade80]", border: "border-[#4ade80]/40" },
    set: { bg: "bg-[#c084fc]/10", text: "text-[#c084fc]", border: "border-[#c084fc]/40" },
    zset: { bg: "bg-[#fb923c]/10", text: "text-[#fb923c]", border: "border-[#fb923c]/40" },
    stream: { bg: "bg-[#22d3ee]/10", text: "text-[#22d3ee]", border: "border-[#22d3ee]/40" },
}

function getTypeBadgeClass(type: string) {
    const colors = typeColors[type] || typeColors.string
    return cn("rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", colors.bg, colors.text, colors.border)
}

function formatTtl(ttl?: number) {
    if (ttl === undefined) {
        return "—"
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

// Skeleton rows for loading state
function TableSkeleton() {
    return (
        <>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-3 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-3 w-8" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                </TableRow>
            ))}
        </>
    )
}

export default function KeyBrowserPage() {
    const routeParams = useParams()
    const connectionId = Array.isArray(routeParams.connectionId)
        ? routeParams.connectionId[0]
        : routeParams.connectionId
    const searchParams = useSearchParams()
    const dbParam = searchParams.get("db")
    const activeDb = dbParam ? Number(dbParam) : 0

    const [search, setSearch] = useState("")
    const [selectedType, setSelectedType] = useState<RedisDataType | "all">("all")
    const [selectedKey, setSelectedKey] = useState<RedisKey | null>(null)
    const [editorOpen, setEditorOpen] = useState(false)
    const [renameOpen, setRenameOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [ttlOpen, setTtlOpen] = useState(false)
    const pattern = useMemo(() => {
        if (!search.trim()) {
            return "*"
        }

        return search.includes("*") ? search.trim() : `${search.trim()}*`
    }, [search])

    const queryParams = useMemo(
        () => ({
            pattern,
            type: selectedType === "all" ? undefined : [selectedType],
            page: 1,
            limit: 50,
            db: activeDb,
        }),
        [pattern, selectedType, activeDb]
    )

    const { data, isLoading, isFetching, refetch } = useRedisKeys(connectionId || "", queryParams)
    const keysResponse: ListKeysResponseDto | undefined =
        data?.data ?? (data as ListKeysResponseDto | undefined)
    const keys: RedisKey[] = keysResponse?.keys || []

    const handleOpenEditor = (key: RedisKey) => {
        setSelectedKey(key)
        setEditorOpen(true)
    }

    const handleOpenRename = (key: RedisKey) => {
        setSelectedKey(key)
        setRenameOpen(true)
    }

    const handleOpenDelete = (key: RedisKey) => {
        setSelectedKey(key)
        setDeleteOpen(true)
    }

    const handleOpenTtl = (key: RedisKey) => {
        setSelectedKey(key)
        setTtlOpen(true)
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Compact header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold">Database {activeDb}</h2>
                    <p className="text-xs text-muted-foreground">
                        {keys.length} keys
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <CreateKeyDialog connectionId={connectionId || ""} database={activeDb} />
                    <div className="relative">
                        <Input
                            placeholder="Search pattern..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-[200px] h-8 text-sm"
                        />
                    </div>
                    <Select
                        value={selectedType}
                        onValueChange={(value) => setSelectedType(value as RedisDataType | "all")}
                    >
                        <SelectTrigger size="sm" className="w-[120px] h-8 text-xs">
                            <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                            {keyTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-xs">
                                    {type === "all" ? "All types" : type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => refetch()} disabled={isFetching}>
                        <ArrowClockwise className={cn("h-4 w-4", isFetching && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Mobile database selector */}
            <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden">
                {databases.map((db) => (
                    <Link
                        key={db}
                        href={`/connections/${connectionId}/keys?db=${db}`}
                        className="shrink-0"
                    >
                        <Button
                            size="sm"
                            variant={activeDb === db ? "secondary" : "outline"}
                            className="h-7 px-2 text-xs rounded-sm"
                        >
                            DB{db}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Keys table - compact */}
            <div className="border rounded-sm bg-card">
                {keys.length === 0 && !isLoading ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                        No keys found for this pattern.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="text-xs font-semibold h-8">Key</TableHead>
                                <TableHead className="text-xs font-semibold h-8 w-20">Type</TableHead>
                                <TableHead className="text-xs font-semibold h-8 w-16">TTL</TableHead>
                                <TableHead className="text-xs font-semibold h-8 w-16">Size</TableHead>
                                <TableHead className="text-xs font-semibold h-8 w-14">Len</TableHead>
                                <TableHead className="text-xs font-semibold h-8 text-right w-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading || isFetching ? (
                                <TableSkeleton />
                            ) : (
                                keys.map((key: RedisKey, index: number) => (
                                    <TableRow 
                                        key={`${key.key}-${index}`}
                                        className="group cursor-pointer transition-all duration-150 hover:bg-muted/50 hover:translate-x-0.5"
                                        onClick={() => handleOpenEditor(key)}
                                    >
                                        <TableCell className="font-mono text-xs py-1.5">{key.key}</TableCell>
                                        <TableCell className="py-1.5">
                                            <span className={getTypeBadgeClass(key.type)}>
                                                {key.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs py-1.5 tabular-nums">{formatTtl(key.ttl)}</TableCell>
                                        <TableCell className="text-xs py-1.5 tabular-nums">{formatBytes(key.size)}</TableCell>
                                        <TableCell className="text-xs py-1.5 tabular-nums">{key.length ?? "—"}</TableCell>
                                        <TableCell className="text-right py-1.5">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <DotsThree className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleOpenEditor(key)
                                                    }}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleOpenRename(key)
                                                    }}>
                                                        Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleOpenTtl(key)
                                                    }}>
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        Set TTL
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleOpenDelete(key)
                                                        }}
                                                    >
                                                        <Trash className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            <KeyEditorSheet
                key={`${selectedKey?.key ?? "none"}-${activeDb}`}
                connectionId={connectionId || ""}
                database={activeDb}
                keyName={selectedKey?.key || null}
                open={editorOpen}
                onOpenChange={(nextOpen) => {
                    setEditorOpen(nextOpen)
                    if (!nextOpen) {
                        setSelectedKey(null)
                    }
                }}
            />

            <RenameKeyDialog
                connectionId={connectionId || ""}
                keyName={selectedKey?.key || ""}
                open={renameOpen}
                onOpenChange={setRenameOpen}
                database={activeDb}
            />

            <DeleteKeyDialog
                connectionId={connectionId || ""}
                keyName={selectedKey?.key || ""}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                database={activeDb}
            />

            <SetTtlDialog
                connectionId={connectionId || ""}
                keyName={selectedKey?.key || ""}
                currentTtl={selectedKey?.ttl}
                open={ttlOpen}
                onOpenChange={setTtlOpen}
                database={activeDb}
            />
        </div>
    );
}
