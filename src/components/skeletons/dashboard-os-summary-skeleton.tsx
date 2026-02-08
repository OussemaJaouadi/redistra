"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardOsSummarySkeleton() {
  return (
    <div className="p-3">
      <Skeleton className="h-3 w-14" />
      <Skeleton className="mt-2 h-4 w-32" />
    </div>
  )
}
