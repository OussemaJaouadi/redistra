"use client"

import { Button } from "@/components/ui/button"
import { Plugs, Plus } from "@phosphor-icons/react"

import { CreateConnectionDialog } from "@/components/shared/dialogs/create-connection-dialog"

interface EmptyConnectionStateProps {
    onCreateClick?: () => void
}

export function EmptyConnectionState({ onCreateClick }: EmptyConnectionStateProps) {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
                <Plugs className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No connections found</h3>
            <p className="mb-6 mt-2 text-sm text-muted-foreground max-w-sm">
                You haven&apos;t added any Redis connections yet. Connect to a local or remote Redis instance to get started.
            </p>
            <CreateConnectionDialog
                trigger={
                    <Button onClick={onCreateClick} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Connection
                    </Button>
                }
            />
        </div>
    )
}
