"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function DashboardHeaderActionSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-11 w-40", className)} />
}
