"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AuditDistributionChartSkeleton() {
  return (
    <div className="rounded-sm border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/10 px-4 py-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4">
        <Skeleton className="h-[220px] w-full" />
      </div>
    </div>
  )
}
