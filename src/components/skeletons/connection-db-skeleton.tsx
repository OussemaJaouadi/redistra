"use client"

import { Skeleton } from "@/components/ui/skeleton"

function DbCardSkeleton() {
  return (
    <div className="rounded-sm border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="mt-3 h-3 w-20" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  )
}

export function ConnectionDbSkeleton() {
  return (
    <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <DbCardSkeleton key={index} />
      ))}
    </div>
  )
}
