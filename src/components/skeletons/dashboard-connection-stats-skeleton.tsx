"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardConnectionStatsSkeleton() {
  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-px" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  )
}
