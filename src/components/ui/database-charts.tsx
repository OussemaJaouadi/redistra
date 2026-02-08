"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { useMemo } from "react"
import { useTheme } from "@/components/theme-provider"
import { ChartTooltip } from "./charts-tooltip"

const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
  "#84cc16", // lime
  "#14b8a6", // teal
]

interface DatabaseChartsProps {
  databases: { number: number; keyCount: number; memoryUsage: number }[]
}

function useChartTheme() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return {
    gridColor: isDark ? "hsl(0 0% 20%)" : "hsl(0 0% 90%)",
    textColor: isDark ? "hsl(0 0% 70%)" : "hsl(0 0% 40%)",
    tooltipBg: isDark ? "hsl(0 0% 10%)" : "hsl(0 0% 100%)",
    tooltipBorder: isDark ? "hsl(0 0% 20%)" : "hsl(0 0% 80%)",
    tooltipText: isDark ? "hsl(0 0% 90%)" : "hsl(0 0% 10%)",
  }
}

export function DatabaseKeysChart({ databases }: DatabaseChartsProps) {
  const theme = useChartTheme()
  
  const data = useMemo(() => {
    return databases
      .filter((db) => db.keyCount > 0)
      .map((db) => ({
        name: `DB${db.number}`,
        keys: db.keyCount,
        memory: db.memoryUsage,
      }))
      .sort((a, b) => b.keys - a.keys)
  }, [databases])

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="name"
          tick={{ fill: theme.textColor, fontSize: 12 }}
          axisLine={{ stroke: theme.gridColor }}
          tickLine={{ stroke: theme.gridColor }}
        />
        <YAxis
          tick={{ fill: theme.textColor, fontSize: 12 }}
          axisLine={{ stroke: theme.gridColor }}
          tickLine={{ stroke: theme.gridColor }}
        />
        <Tooltip
          content={
            <ChartTooltip formatter={(value: number, name: string) => [`${value.toLocaleString()} keys`, name]} />
          }
        />
        <Bar dataKey="keys" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DatabaseDistributionChart({ databases }: DatabaseChartsProps) {
  const theme = useChartTheme()
  
  const data = useMemo(() => {
    const activeDbs = databases.filter((db) => db.keyCount > 0)
    const totalKeys = activeDbs.reduce((sum, db) => sum + db.keyCount, 0)

    return activeDbs
      .map((db) => ({
        name: `DB${db.number}`,
        value: db.keyCount,
        percentage: totalKeys > 0 ? ((db.keyCount / totalKeys) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.value - a.value)
  }, [databases])

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={
            <ChartTooltip
              showPercentage
              formatter={(value: number, name: string, payload: unknown) => {
                const percentage =
                  typeof payload === "object" && payload !== null && "percentage" in payload
                    ? (payload as { percentage?: number }).percentage
                    : undefined
                return [`${value.toLocaleString()} keys (${percentage}%)`, name]
              }}
            />
          }
        />
        <Legend
          verticalAlign="bottom"
          align="center"
          height={40}
          iconType="circle"
          wrapperStyle={{ 
            fontSize: "11px",
            color: theme.textColor,
            paddingTop: "10px"
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function DatabaseMemoryChart({ databases }: DatabaseChartsProps) {
  const theme = useChartTheme()
  
  const data = useMemo(() => {
    return databases
      .filter((db) => db.memoryUsage > 0)
      .map((db) => ({
        name: `DB${db.number}`,
        memory: db.memoryUsage,
        memoryFormatted: formatBytes(db.memoryUsage),
      }))
      .sort((a, b) => b.memory - a.memory)
  }, [databases])

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
        <XAxis
          dataKey="name"
          tick={{ fill: theme.textColor, fontSize: 12 }}
          axisLine={{ stroke: theme.gridColor }}
          tickLine={{ stroke: theme.gridColor }}
        />
        <YAxis
          tick={{ fill: theme.textColor, fontSize: 12 }}
          axisLine={{ stroke: theme.gridColor }}
          tickLine={{ stroke: theme.gridColor }}
          tickFormatter={(value) => formatBytesCompact(value)}
        />
        <Tooltip
          content={
            <ChartTooltip
              formatter={(value: number, _name: string, payload: unknown) => {
                const memoryFormatted =
                  typeof payload === "object" && payload !== null && "memoryFormatted" in payload
                    ? (payload as { memoryFormatted?: string }).memoryFormatted
                    : undefined
                return [memoryFormatted ?? String(value), "Memory"]
              }}
            />
          }
        />
        <Bar dataKey="memory" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatBytesCompact(bytes: number): string {
  if (bytes === 0) return "0"
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(1)}${["B", "K", "M", "G"][i]}`
}
