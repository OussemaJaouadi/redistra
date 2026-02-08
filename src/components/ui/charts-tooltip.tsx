"use client"

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    payload?: unknown
  }>
  label?: string
  showPercentage?: boolean
  total?: number
  formatter?: (value: number, name: string, payload?: unknown) => string | [string, string]
}

export function ChartTooltip({
  active,
  payload,
  label,
  showPercentage = false,
  total,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="bg-popover border rounded-lg p-3 text-sm shadow-lg">
      {label && (
        <div className="text-muted-foreground mb-2 pb-1 border-b font-medium">
          {label}
        </div>
      )}
      {payload.map((item, index) => {
        const formatted = formatter ? formatter(item.value, item.name, item.payload) : item.value
        const displayValue = Array.isArray(formatted) ? formatted[0] : String(formatted)
        const displayName = Array.isArray(formatted) ? formatted[1] : item.name
        const percentage = showPercentage && total 
          ? ` (${((item.value / total) * 100).toFixed(1)}%)`
          : ''
        
        return (
          <div key={index} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{displayName}</span>
            <span className="font-semibold">
              {displayValue}{percentage}
            </span>
          </div>
        )
      })}
    </div>
  )
}
