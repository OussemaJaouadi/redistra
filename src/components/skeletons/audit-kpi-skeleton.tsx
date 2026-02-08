"use client"

import { Skeleton } from "@/components/ui/skeleton"

function KpiCardSkeleton() {
  return (
    <div className="rounded-sm border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-2 h-6 w-20" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  )
}

export function AuditKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </div>
  )
}
