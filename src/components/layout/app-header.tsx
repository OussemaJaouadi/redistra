"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Clock } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function AppHeader() {
    const [timeLabel, setTimeLabel] = useState("—")
    const [timeZone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "—")

    useEffect(() => {
        const updateTime = () => {
            const next = new Date()
            setTimeLabel(next.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }))
        }

        updateTime()

        const interval = setInterval(updateTime, 1000 * 30)

        return () => clearInterval(interval)
    }, [])

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b px-4">
            <div className="flex flex-1 items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/">
                                RediStra
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Connections</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="flex items-center gap-3 rounded-sm border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                    <span className="font-mono text-base text-foreground" suppressHydrationWarning>
                        {timeLabel}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground" suppressHydrationWarning>
                        {timeZone}
                    </span>
                </div>
            </div>
        </header>
    );
}
