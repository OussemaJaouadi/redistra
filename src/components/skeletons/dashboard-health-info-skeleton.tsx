"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardHealthInfoSkeleton() {
  return (
    <div className="rounded-sm border bg-card">
      <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
        <div>
          <div className="p-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        </div>
        <div>
          <div className="p-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        </div>
      </div>
    </div>
  )
}
