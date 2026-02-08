"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardEnvSummarySkeleton() {
  return (
    <div className="p-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  )
}
