"use client"

import { Skeleton } from "@/components/ui/skeleton"

function HealthCardSkeleton() {
  return (
    <div className="rounded-sm border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="mt-2 h-6 w-28" />
    </div>
  )
}

export function DashboardHealthCardsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <HealthCardSkeleton />
      <HealthCardSkeleton />
      <HealthCardSkeleton />
    </div>
  )
}
