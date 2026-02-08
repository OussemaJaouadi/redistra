"use client"

import { useState } from "react"
import { useAuditActivity, useAuditDistribution, useAuditLogs, useAuditSummary, useExportAuditLogs } from "@/lib/api/hooks/audit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarIcon, Eye, FileText, Pulse, Users, WarningCircle, CheckCircle, ArrowLeft, ArrowRight } from "@phosphor-icons/react"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"
import { ChartTooltip } from "@/components/ui/charts-tooltip"
import { AuditLogDetailDialog } from "@/components/features/audit/audit-log-detail-dialog"
import { toast } from "@/lib/toast"
import { format } from "date-fns"
import { cn, getAxisColors, getColorsArray } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import type {
    AuditLog,
    ListAuditLogsResponseDto,
    AuditSummaryResponseDto,
    AuditActivityResponseDto,
    AuditDistributionResponseDto,
    AuditDistributionPoint
} from "@/types"
import { AuditKpiSkeleton } from "@/components/skeletons/audit-kpi-skeleton"
import { AuditActivityChartSkeleton } from "@/components/skeletons/audit-activity-chart-skeleton"
import { AuditDistributionChartSkeleton } from "@/components/skeletons/audit-distribution-chart-skeleton"
import { AuditTableSkeleton } from "@/components/skeletons/audit-table-skeleton"

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

function getRelativeTime(date: Date) {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    const diff = (date.getTime() - new Date().getTime()) / 1000
    const absDiff = Math.abs(diff)

    if (absDiff < 60) return rtf.format(Math.round(diff), 'second')
    if (absDiff < 3600) return rtf.format(Math.round(diff / 60), 'minute')
    if (absDiff < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
    return rtf.format(Math.round(diff / 86400), 'day')
}

export default function AuditPage() {
    const [search, setSearch] = useState("")
    const [actionFilter, setActionFilter] = useState<string>("all")
    const [userFilter, setUserFilter] = useState("")
    const [startDate, setStartDate] = useState<Date | undefined>()
    const [endDate, setEndDate] = useState<Date | undefined>()
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(25)
    const [activityRange, setActivityRange] = useState<'last7' | 'lastMonth' | 'byWeek' | 'byMonth'>('last7')
    const [distributionRange, setDistributionRange] = useState<'all' | 'lastMonth'>('all')
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const { data, isLoading } = useAuditLogs({
        search: search || undefined,
        action: actionFilter === "all" ? undefined : actionFilter,
        userId: userFilter || undefined,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        page,
        limit: pageSize,
    })
    const logsResponse: ListAuditLogsResponseDto | undefined =
        data?.data ?? (data as ListAuditLogsResponseDto | undefined)
    const logs = logsResponse?.logs || []
    const pagination = logsResponse?.pagination

    const { data: summaryResponse, isLoading: isSummaryLoading } = useAuditSummary()
    const summaryPayload: AuditSummaryResponseDto | undefined =
        summaryResponse?.data ?? (summaryResponse as AuditSummaryResponseDto | undefined)
    const summary = summaryPayload?.summary

    const { data: activityResponse, isLoading: isActivityLoading } = useAuditActivity(activityRange)
    const activityPayload: AuditActivityResponseDto | undefined =
        activityResponse?.data ?? (activityResponse as AuditActivityResponseDto | undefined)
    const activityPoints = activityPayload?.points || []

    const { data: distributionResponse, isLoading: isDistributionLoading } = useAuditDistribution(distributionRange)
    const distributionPayload: AuditDistributionResponseDto | undefined =
        distributionResponse?.data ?? (distributionResponse as AuditDistributionResponseDto | undefined)
    const distributionPoints = distributionPayload?.points || []

    const exportLogs = useExportAuditLogs()

    const handleExport = (format: "json" | "csv") => {
        exportLogs.mutate(
            {
                format,
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString(),
            },
            {
                onSuccess: ({ blob, filename }) => {
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = filename || `audit-log-${format === "json" ? "export.json" : "export.csv"}`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                    toast.success(`Audit log exported as ${format.toUpperCase()}`)
                },
                onError: (error: unknown) => {
                    const message = error instanceof Error ? error.message : "Failed to export audit log"
                    toast.fail(message)
                },
            }
        )
    }

    const openDetail = (log: AuditLog) => {
        setSelectedLog(log)
        setIsDetailOpen(true)
    }

    const uniqueActions: string[] = Array.from(new Set(logs.map((log: AuditLog) => log.action)))
    const total = pagination?.total ?? 0
    const totalPages = Math.max(1, pagination?.totalPages ?? 1)
    const currentPage = Math.min(page, totalPages)
    const startIndex = total > 0 ? (currentPage - 1) * pageSize + 1 : 0

    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === "dark"
    const chartColors = getColorsArray()
    const axisColors = getAxisColors(isDark)

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Audit Log</h1>
                    <p className="text-muted-foreground">View all system activities and changes</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport("json")}
                        disabled={exportLogs.isPending}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Export JSON
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport("csv")}
                        disabled={exportLogs.isPending}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            {isSummaryLoading ? (
                <AuditKpiSkeleton />
            ) : summary ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Pulse className="h-4 w-4 text-secondary" />
                                <span>Total Events</span>
                            </div>
                        </div>
                        <p className="mt-1 text-lg font-semibold">{summary.totalEvents.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">All audit events</p>
                    </div>
                    <div className="rounded-sm border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span>Active Users</span>
                            </div>
                        </div>
                        <p className="mt-1 text-lg font-semibold">{summary.activeUsers}</p>
                        <p className="text-xs text-muted-foreground">Unique users</p>
                    </div>
                    <div className="rounded-sm border border-success/20 bg-success/5 p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-success" />
                                <span>Success Rate</span>
                            </div>
                        </div>
                        <p className="mt-1 text-lg font-semibold">{summary.successRate}%</p>
                        <p className="text-xs text-muted-foreground">Successful actions</p>
                    </div>
                    <div className="rounded-sm border border-danger/20 bg-danger/5 p-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <WarningCircle className="h-4 w-4 text-danger" />
                                <span>Failed Logins</span>
                            </div>
                        </div>
                        <p className="mt-1 text-lg font-semibold">{summary.failedLogins}</p>
                        <p className="text-xs text-muted-foreground">Authentication failures</p>
                    </div>
                </div>
            ) : null}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {isActivityLoading ? (
                    <AuditActivityChartSkeleton />
                ) : (
                    <div className="rounded-sm border bg-card">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/10 px-4 py-2">
                            <div>
                                <p className="text-sm font-medium">Activity Over Time</p>
                                <p className="text-xs text-muted-foreground">Audit events trend</p>
                            </div>
                            <Tabs value={activityRange} onValueChange={(value) => setActivityRange(value as typeof activityRange)}>
                                <TabsList className="h-8">
                                    <TabsTrigger value="last7" className="text-xs">Last 7d</TabsTrigger>
                                    <TabsTrigger value="lastMonth" className="text-xs">Last 30d</TabsTrigger>
                                    <TabsTrigger value="byWeek" className="text-xs">By Week</TabsTrigger>
                                    <TabsTrigger value="byMonth" className="text-xs">By Month</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="p-4">
                            {activityPoints.length === 0 ? (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    No activity data available.
                                </div>
                            ) : (
                                <div className="h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={activityPoints} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={axisColors.grid} opacity={0.5} />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{ fontSize: 11, fill: axisColors.text }} 
                                                axisLine={{ stroke: axisColors.line }}
                                                tickLine={{ stroke: axisColors.line }}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 11, fill: axisColors.text }} 
                                                axisLine={{ stroke: axisColors.line }}
                                                tickLine={{ stroke: axisColors.line }}
                                                allowDecimals={false}
                                            />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Line 
                                                type="monotone" 
                                                dataKey="events" 
                                                stroke="#3b82f6" 
                                                strokeWidth={2}
                                                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                                                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isDistributionLoading ? (
                    <AuditDistributionChartSkeleton />
                ) : (
                    <div className="rounded-sm border bg-card">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/10 px-4 py-2">
                            <div>
                                <p className="text-sm font-medium">Activity Distribution</p>
                                <p className="text-xs text-muted-foreground">Actions by category</p>
                            </div>
                            <Tabs value={distributionRange} onValueChange={(value) => setDistributionRange(value as typeof distributionRange)}>
                                <TabsList className="h-8">
                                    <TabsTrigger value="all" className="text-xs">All time</TabsTrigger>
                                    <TabsTrigger value="lastMonth" className="text-xs">Last 30d</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <div className="p-4">
                            {distributionPoints.length === 0 ? (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    No distribution data available.
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px] items-center">
                                    <div className="h-[220px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={distributionPoints}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {distributionPoints.map((point: AuditDistributionPoint, index) => (
                                                        <Cell key={`cell-${point.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                    content={
                                                        <ChartTooltip 
                                                            showPercentage
                                                            total={distributionPoints.reduce((sum, item) => sum + item.value, 0)}
                                                        />
                                                    }
                                                />
                                                <Legend 
                                                    verticalAlign="bottom" 
                                                    height={30}
                                                    iconType="circle"
                                                    wrapperStyle={{ fontSize: '11px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3 text-center">
                                        <p className="text-xs text-muted-foreground">Total Events</p>
                                        <p className="mt-1 text-xl font-semibold">
                                            {distributionPoints.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">For selected range</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border bg-muted/20 px-3 py-2">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    <Input
                        placeholder="Search logs..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="h-8 w-48 bg-background/70"
                    />
                    <Select
                        value={actionFilter}
                        onValueChange={(value) => {
                            setActionFilter(value)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger className="h-8 w-40">
                            <SelectValue placeholder="All actions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All actions</SelectItem>
                            {uniqueActions.map((action: string) => (
                                <SelectItem key={action} value={action}>
                                    {formatAction(action)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Filter by user..."
                        value={userFilter}
                        onChange={(e) => {
                            setUserFilter(e.target.value)
                            setPage(1)
                        }}
                        className="h-8 w-40 bg-background/70"
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {startDate ? format(startDate, "PP") : "Start Date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={(date) => {
                                    setStartDate(date)
                                    setPage(1)
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {endDate ? format(endDate, "PP") : "End Date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={(date) => {
                                    setEndDate(date)
                                    setPage(1)
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
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

            {isLoading ? (
                <AuditTableSkeleton />
            ) : (
                <div className="rounded-md border">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/10 px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                            {total > 0 ? (
                                <>
                                    Showing <span className="font-semibold text-foreground">{startIndex}</span>-
                                    <span className="font-semibold text-foreground">{Math.min(startIndex + pageSize - 1, total)}</span> of{" "}
                                    <span className="font-semibold text-foreground">{total}</span>
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
                                <TableHead>Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead className="hidden md:table-cell">Resource</TableHead>
                                <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                                <TableHead className="hidden md:table-cell">Timestamp</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No audit logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log: AuditLog) => (
                                    <TableRow key={log.id} className="group transition-all duration-150 hover:bg-muted/50 hover:translate-x-0.5 cursor-pointer">
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className={cn("px-2 py-0.5 rounded-sm text-xs font-medium border w-fit", getActionBadgeClass(log.action))}>
                                                    {formatAction(log.action)}
                                                </span>
                                                <span className="text-xs text-muted-foreground md:hidden">
                                                    {log.resourceType}{log.resourceName ? `: ${log.resourceName}` : ""}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground md:hidden">
                                                    {getRelativeTime(new Date(log.timestamp))}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">{log.username || log.userId || "System"}</span>
                                                <span className="text-xs font-mono text-muted-foreground md:hidden">
                                                    {log.ipAddress || "—"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                                            {log.resourceType}{log.resourceName ? `: ${log.resourceName}` : ""}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground font-mono hidden lg:table-cell">
                                            {log.ipAddress || "—"}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDetail(log)}
                                                title="View details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <AuditLogDetailDialog
                log={selectedLog}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    )
}
