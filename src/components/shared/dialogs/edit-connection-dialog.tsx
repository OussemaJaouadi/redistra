"use client"

import type { ApiResponse, Connection, GetConnectionSecretResponseDto, UpdateConnectionRequestDto } from "@/types"
import { useConnectionSecret, useUpdateConnection } from "@/lib/api/hooks/connections"
import { PlugsConnected } from "@phosphor-icons/react"
import { toast } from "@/lib/toast"
import { useEffect, useMemo, useRef, useState } from "react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ConnectionForm } from "@/components/shared/forms/connection-form"

interface EditConnectionDialogProps {
    connection: Connection | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditConnectionDialog({
    connection,
    open,
    onOpenChange,
}: EditConnectionDialogProps) {
    const { mutate: updateConnection, isPending } = useUpdateConnection(connection?.id || "")
    const [shouldRevealPassword, setShouldRevealPassword] = useState(false)
    const { data: secretResponse, isLoading: isSecretLoading, error: secretError } = useConnectionSecret(
        connection?.id || "",
        open && shouldRevealPassword
    )
    const hasNotifiedSecret = useRef(false)

    const secretPayload = (secretResponse?.data ?? secretResponse) as
        | ApiResponse<GetConnectionSecretResponseDto>
        | GetConnectionSecretResponseDto
        | undefined
    const prefillPassword =
        secretPayload && "password" in secretPayload ? secretPayload.password : undefined

    const forcePasswordPrefill = prefillPassword !== undefined
    const autoShowPassword = !!prefillPassword

    useEffect(() => {
        if (secretError) {
            toast.fail("Failed to load connection password")
            hasNotifiedSecret.current = true
        }
    }, [secretError])

    useEffect(() => {
        if (!shouldRevealPassword || hasNotifiedSecret.current) {
            return
        }

        if (prefillPassword !== undefined) {
            if (prefillPassword) {
                toast.info("Password loaded")
            } else {
                toast.info("No password set for this connection")
            }
            hasNotifiedSecret.current = true
        }
    }, [prefillPassword, shouldRevealPassword])

    const handleSubmit = (data: UpdateConnectionRequestDto) => {
        if (!connection) {
            return
        }

        const payload: UpdateConnectionRequestDto = {
            ...data,
        }

        if (payload.password === "" || (prefillPassword !== undefined && payload.password === prefillPassword)) {
            delete payload.password
        }

        updateConnection(payload, {
            onSuccess: () => {
                toast.success("Connection updated")
                onOpenChange(false)
            },
            onError: (error: unknown) => {
                toast.fail(error instanceof Error ? error.message : "Failed to update connection")
            },
        })
    }

    const initialValues = useMemo(() => {
        if (!connection) {
            return undefined
        }

        return {
            name: connection.name,
            description: connection.description || undefined,
            host: connection.host,
            port: connection.port,
            username: connection.username || undefined,
            database: connection.database,
            useTls: connection.useTls,
            isShared: connection.isShared,
        }
    }, [connection])

    if (!connection) {
        return null
    }

    const handleDialogChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            setShouldRevealPassword(false)
            hasNotifiedSecret.current = false
        }
        onOpenChange(nextOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogChange}>
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
                                <DialogTitle>Edit Connection</DialogTitle>
                                <DialogDescription className="text-foreground/60">
                                    Update details for <span className="text-foreground font-semibold italic">{connection.name}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="px-6 py-4">
                    <ConnectionForm
                        allowConnectionString={false}
                        includeDatabase={false}
                        prefillPassword={prefillPassword ?? undefined}
                        onRevealPassword={() => setShouldRevealPassword(true)}
                        isPasswordLoading={isSecretLoading}
                        forcePasswordPrefill={forcePasswordPrefill}
                        autoShowPassword={autoShowPassword}
                        initialValues={initialValues}
                        onSubmitManual={handleSubmit}
                        onCancel={() => onOpenChange(false)}
                        submitLabel="Save Changes"
                        isSubmitting={isPending}
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
