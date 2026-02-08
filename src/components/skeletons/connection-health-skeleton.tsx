"use client"

import { Skeleton } from "@/components/ui/skeleton"

function HealthCardSkeleton() {
  return (
    <div className="rounded-sm border bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="mt-2 h-5 w-32" />
    </div>
  )
}

export function ConnectionHealthSkeleton() {
  return (
    <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <HealthCardSkeleton key={index} />
      ))}
    </div>
  )
}
