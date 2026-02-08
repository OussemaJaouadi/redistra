"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Plugs } from "@phosphor-icons/react";
import Link from "next/link";
import { useConnectConnection, useConnection } from "@/lib/api/hooks/connections";
import { useEffect } from "react";
import type { GetConnectionResponseDto } from "@/types";

export function ConnectionSubHeader({ connectionId }: { connectionId: string }) {
    const { data } = useConnection(connectionId)
    const { mutate: connect } = useConnectConnection()
    const connection =
        data?.data?.connection || (data as GetConnectionResponseDto | undefined)?.connection
    const connectionName = connection?.name || "Connection"
    const connectionHost = connection?.host ? `${connection.host}:${connection.port}` : "—"

    useEffect(() => {
        if (!connectionId) {
            return
        }

        connect(connectionId)
    }, [connectionId, connect])

    return (
        <div className="flex flex-col border-b bg-card px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/">
                            <ArrowLeft />
                        </Link>
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">{connectionName}</h2>
                            <div className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-redis-pulse absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                                </span>
                                Connected
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{connectionHost}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" className="rounded-sm">
                        <Plugs className="mr-2 size-4" />
                        Disconnect
                    </Button>
                </div>
            </div>
        </div>
    );
}
