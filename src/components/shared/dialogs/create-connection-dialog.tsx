"use client"

import { useState } from "react"
import { useCreateConnection } from "@/lib/api/hooks/connections"
import { toast } from "@/lib/toast"
import { useRouter } from "next/navigation"
import type { ApiResponse, CreateConnectionRequestDto, CreateConnectionResponseDto } from "@/types"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ConnectionForm } from "@/components/shared/forms/connection-form"
import { PlugsConnected } from "@phosphor-icons/react"

interface CreateConnectionDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    trigger?: React.ReactNode
}

export function CreateConnectionDialog({
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
}: CreateConnectionDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen

    const { mutate: createConnection, isPending } = useCreateConnection()
    const router = useRouter()

    const onManualSubmit = (data: CreateConnectionRequestDto) => {
        createConnection(data, {
            onSuccess: handleSuccess,
            onError: handleError,
        })
    }

    const onUriSubmit = (data: CreateConnectionRequestDto) => {
        createConnection(data, {
            onSuccess: handleSuccess,
            onError: handleError,
        })
    }

    const handleSuccess = (result: ApiResponse<CreateConnectionResponseDto>) => {
        toast.success("Connection created successfully")
        onOpenChange?.(false)

        const legacyConnectionId = (result as unknown as CreateConnectionResponseDto | undefined)?.connection?.id
        const connectionId = result.data?.connection?.id ?? legacyConnectionId
        if (connectionId) {
            router.push(`/connections/${connectionId}`)
        }
    }

    const handleError = (error: unknown) => {
        toast.fail(error instanceof Error ? error.message : "Failed to create connection")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent size="xl" className="p-0 overflow-hidden border-border/80">
                <div className="bg-success/5 border-b border-success/20">
                    <DialogHeader className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-success">
                            <PlugsConnected className="size-24 rotate-12" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex p-2 rounded-lg bg-success text-success-foreground shadow-lg shadow-success/20">
                                <PlugsConnected className="size-6" weight="bold" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <DialogTitle>New Connection</DialogTitle>
                                <DialogDescription className="text-foreground/60">
                                    Add a new Redis connection to your dashboard.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6">
                    <ConnectionForm
                        onSubmitManual={onManualSubmit}
                        onSubmitUri={onUriSubmit}
                        onCancel={() => onOpenChange?.(false)}
                        submitLabel="Create Connection"
                        includeDatabase={false}
                        isSubmitting={isPending}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
