"use client"

import { useState } from "react"
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserStatus, useResetPassword } from "@/lib/api/hooks/users"
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Plus,
    PencilSimple,
    Trash,
    ToggleLeft,
    ToggleRight,
    Key,
    Eye,
    Users,
    Shield,
    DotsThreeVertical,
    ArrowLeft,
    ArrowRight,
    CaretDown,
    CaretUp,
} from "@phosphor-icons/react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { toast } from "@/lib/toast"
import type { User, ListUsersResponseDto, CreateUserRequestDto, UpdateUserRequestDto } from "@/types"
import { cn } from "@/lib/utils"
import { ChartTooltip } from "@/components/ui/charts-tooltip"
import { UsersStatsSkeleton } from "@/components/skeletons/users-stats-skeleton"
import { UsersTableSkeleton } from "@/components/skeletons/users-table-skeleton"
import { CreateUserDialog } from "@/components/features/users/create-user-dialog"
import { EditUserDialog } from "@/components/features/users/edit-user-dialog"
import { DeleteUserDialog } from "@/components/features/users/delete-user-dialog"
import { ResetPasswordDialog } from "@/components/features/users/reset-password-dialog"
import { ViewUserDialog } from "@/components/features/users/view-user-dialog"

function UserBadge({ role, isActive }: { role: string; isActive: boolean }) {
    const roleColors = {
        admin: "bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/40",
        editor: "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/40",
        viewer: "bg-[#6b7280]/10 text-[#6b7280] border-[#6b7280]/40",
    }

    return (
        <div className="flex items-center gap-2">
            <span className={cn("px-2 py-0.5 rounded-sm text-xs font-medium border", roleColors[role as keyof typeof roleColors])}>
                {role}
            </span>
            {!isActive && (
                <span className="px-2 py-0.5 rounded-sm text-xs font-medium bg-muted text-muted-foreground border">
                    Disabled
                </span>
            )}
        </div>
    )
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

export default function UsersPage() {
    const [search, setSearch] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [sortKey, setSortKey] = useState<"lastLogin" | "created" | null>(null)
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
    const [pageSize, setPageSize] = useState(25)
    const [page, setPage] = useState(1)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)


    const { data, isLoading } = useUsers({
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    })
    const usersPayload: ListUsersResponseDto | undefined =
        data?.data ?? (data as ListUsersResponseDto | undefined)
    const users = usersPayload?.users || []

    const normalizedSearch = search.trim().toLowerCase()
    const filtered = users.filter((user: User) => {
        const nameMatch = user.username.toLowerCase().includes(normalizedSearch)
        if (!nameMatch) return false
        if (roleFilter !== "all" && user.role !== roleFilter) return false
        if (statusFilter !== "all" && user.isActive !== (statusFilter === "active")) return false
        return true
    })

    const sorted = [...filtered].sort((a, b) => {
        if (!sortKey) return 0
        const aDate = sortKey === "lastLogin" ? a.lastLoginAt : a.createdAt
        const bDate = sortKey === "lastLogin" ? b.lastLoginAt : b.createdAt
        const aTime = aDate ? new Date(aDate).getTime() : -Infinity
        const bTime = bDate ? new Date(bDate).getTime() : -Infinity
        const diff = aTime - bTime
        return sortDir === "asc" ? diff : -diff
    })

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
    const currentPage = Math.min(page, totalPages)
    const startIndex = (currentPage - 1) * pageSize
    const pageItems = sorted.slice(startIndex, startIndex + pageSize)

    const handleSort = (key: "lastLogin" | "created") => {
        if (sortKey !== key) {
            setSortKey(key)
            setSortDir("desc")
            return
        }

        setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
    }

    const createUser = useCreateUser()
    const updateUser = useUpdateUser(editingUser?.id || "")
    const deleteUser = useDeleteUser()
    const toggleStatus = useToggleUserStatus()
    const resetPassword = useResetPassword()

    const handleCreate = (data: CreateUserRequestDto) => {
        createUser.mutate(data, {
            onSuccess: () => {
                toast.success("User created successfully")
                setIsCreateDialogOpen(false)
            },
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to create user"
                toast.fail(message)
            },
        })
    }

    const handleUpdate = (data: UpdateUserRequestDto) => {
        if (!editingUser) return
        updateUser.mutate(data, {
            onSuccess: () => {
                toast.success("User updated successfully")
                setIsEditDialogOpen(false)
                setEditingUser(null)
            },
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to update user"
                toast.fail(message)
            },
        })
    }

    const handleDelete = () => {
        if (!editingUser) return
        deleteUser.mutate(editingUser.id, {
            onSuccess: () => {
                toast.success("User deleted successfully")
                setIsDeleteDialogOpen(false)
                setEditingUser(null)
            },
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to delete user"
                toast.fail(message)
            },
        })
    }

    const handleToggleStatus = (user: User) => {
        toggleStatus.mutate(user.id, {
            onSuccess: () => {
                toast.success(user.isActive ? "User disabled" : "User enabled")
            },
            onError: (error: unknown) => {
                const message = error instanceof Error ? error.message : "Failed to toggle user status"
                toast.fail(message)
            },
        })
    }

    const handleResetPassword = (password: string) => {
        if (!editingUser) return
        resetPassword.mutate(
            { id: editingUser.id, newPassword: password },
            {
                onSuccess: () => {
                    toast.success("Password reset successfully")
                    setIsResetPasswordDialogOpen(false)
                    setEditingUser(null)
                },
                onError: (error: unknown) => {
                    const message = error instanceof Error ? error.message : "Failed to reset password"
                    toast.fail(message)
                },
            }
        )
    }

    const openEditDialog = (user: User) => {
        setEditingUser(user)
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (user: User) => {
        setEditingUser(user)
        setIsDeleteDialogOpen(true)
    }

    const openResetPasswordDialog = (user: User) => {
        setEditingUser(user)
        setIsResetPasswordDialogOpen(true)
    }

    const openViewDialog = (user: User) => {
        setEditingUser(user)
        setIsViewDialogOpen(true)
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage users and their permissions</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border bg-muted/20 px-3 py-2">
                <div className="flex flex-1 flex-wrap items-center gap-2">
                    <Input
                        placeholder="Filter by username..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                        className="h-8 w-48 bg-background/70"
                    />
                    <Select
                        value={roleFilter}
                        onValueChange={(value) => {
                            setRoleFilter(value)
                            setPage(1)
                        }}
                    >
                        <SelectTrigger size="sm" className="h-8">
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <SelectItem value="disabled">Disabled</SelectItem>
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

            {/* Simple Stats Cards */}
            {isLoading ? (
                <UsersStatsSkeleton />
            ) : users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-sm border border-secondary/20 bg-secondary/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-4 w-4 text-secondary" />
                            <span>Total Users</span>
                        </div>
                        <p className="mt-1 text-lg font-semibold">{users.length}</p>
                    </div>
                    <div className="rounded-sm border border-success/20 bg-success/5 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Shield className="h-4 w-4 text-success" />
                            <span>Active</span>
                        </div>
                        <p className="mt-1 text-lg font-semibold">{users.filter((u: User) => u.isActive).length}</p>
                    </div>
                    <div className="rounded-sm border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs text-muted-foreground">Role Distribution</p>
                        <div className="mt-2 h-[70px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Admin', value: users.filter((u: User) => u.role === 'admin').length },
                                            { name: 'Editor', value: users.filter((u: User) => u.role === 'editor').length },
                                            { name: 'Viewer', value: users.filter((u: User) => u.role === 'viewer').length }
                                        ].filter(d => d.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={18}
                                        outerRadius={30}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        <Cell fill="#dc2626" />
                                        <Cell fill="#3b82f6" />
                                        <Cell fill="#6b7280" />
                                    </Pie>
                                    <Tooltip 
                                        content={
                                            <ChartTooltip 
                                                showPercentage
                                                total={users.length}
                                            />
                                        }
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : null}

            {isLoading ? (
                <UsersTableSkeleton />
            ) : (
                <div className="rounded-md border">
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
                                <TableHead>Username</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>
                                    <button
                                        type="button"
                                        onClick={() => handleSort("lastLogin")}
                                        className="inline-flex items-center gap-1"
                                    >
                                        Last Login
                                        {sortKey === "lastLogin" ? (
                                            sortDir === "asc" ? <CaretUp className="h-3 w-3" /> : <CaretDown className="h-3 w-3" />
                                        ) : null}
                                    </button>
                                </TableHead>
                                <TableHead>
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                        No users match your filters
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageItems.map((user: User) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>
                                            <UserBadge role={user.role} isActive={user.isActive} />
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-sm text-xs font-medium border",
                                                user.isActive 
                                                    ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/40" 
                                                    : "bg-muted text-muted-foreground border-muted-foreground/40"
                                            )}>
                                                {user.isActive ? "Active" : "Disabled"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {user.lastLoginAt
                                                ? getRelativeTime(new Date(user.lastLoginAt))
                                                : "Never"
                                            }
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {user.createdAt ? getRelativeTime(new Date(user.createdAt)) : "-"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                        <div className="hidden justify-end gap-2 md:flex">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8"
                                                onClick={() => openViewDialog(user)}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8"
                                                onClick={() => handleToggleStatus(user)}
                                            >
                                                {user.isActive ? (
                                                    <ToggleRight className="mr-2 h-4 w-4 text-[#22c55e]" />
                                                ) : (
                                                    <ToggleLeft className="mr-2 h-4 w-4 text-muted-foreground" />
                                                )}
                                                {user.isActive ? "Disable" : "Enable"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8"
                                                onClick={() => openResetPasswordDialog(user)}
                                            >
                                                <Key className="mr-2 h-4 w-4" />
                                                Reset
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8"
                                                onClick={() => openEditDialog(user)}
                                            >
                                                <PencilSimple className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-destructive hover:text-destructive"
                                                onClick={() => openDeleteDialog(user)}
                                            >
                                                <Trash className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                        <div className="flex justify-end md:hidden">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <DotsThreeVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => openViewDialog(user)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View user
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                                                        {user.isActive ? (
                                                            <ToggleRight className="mr-2 h-4 w-4 text-[#22c55e]" />
                                                        ) : (
                                                            <ToggleLeft className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        )}
                                                        {user.isActive ? "Disable user" : "Enable user"}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                                                        <Key className="mr-2 h-4 w-4" />
                                                        Reset password
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                        <PencilSimple className="mr-2 h-4 w-4" />
                                                        Edit user
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => openDeleteDialog(user)}
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Delete user
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            <CreateUserDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSubmit={handleCreate}
                isPending={createUser.isPending}
            />

            <EditUserDialog
                key={editingUser?.id ?? "empty"}
                user={editingUser}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onSubmit={handleUpdate}
                isPending={updateUser.isPending}
            />

            <DeleteUserDialog
                user={editingUser}
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                isPending={deleteUser.isPending}
            />

            <ResetPasswordDialog
                user={editingUser}
                open={isResetPasswordDialogOpen}
                onOpenChange={setIsResetPasswordDialogOpen}
                onSubmit={handleResetPassword}
                isPending={resetPassword.isPending}
            />

            <ViewUserDialog
                user={editingUser}
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
            />
        </div>
    )
}
