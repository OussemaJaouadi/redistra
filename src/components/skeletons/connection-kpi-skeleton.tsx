"use client"

import { Skeleton } from "@/components/ui/skeleton"

function KpiCardSkeleton() {
  return (
    <div className="rounded-sm border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="mt-2 h-7 w-24" />
    </div>
  )
}

export function ConnectionKpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </div>
  )
}
