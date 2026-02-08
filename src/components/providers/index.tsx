"use client"

import * as React from "react"
import { QueryProvider } from "./query-provider"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryProvider>
            <ThemeProvider>
                {children}
                <Toaster />
            </ThemeProvider>
        </QueryProvider>
    )
}
