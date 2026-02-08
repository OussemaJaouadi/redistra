import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAxisColors(isDark = false) {
  return {
    grid: isDark ? "#262626" : "#e5e5e5",
    text: isDark ? "#a3a3a3" : "#737373",
    line: isDark ? "#262626" : "#e5e5e5",
  }
}

export function getColorsArray(): string[] {
  return [
    "#3b82f6", // blue
    "#22c55e", // green  
    "#f59e0b", // yellow
    "#ef4444", // red
    "#8b5cf6", // purple
    "#06b6d4", // cyan
    "#f97316", // orange
    "#ec4899", // pink
  ]
}
