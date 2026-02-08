/**
 * Audit Controllers
 * Handles audit log operations
 */

import { db } from '@/db'
import { auditLogs, users } from '@/db/schema'
import { desc, and, or, gte, lte, count, eq, sql, like } from 'drizzle-orm'
import { addDays, addMonths, endOfDay, format, startOfDay, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from 'date-fns'
import type {
  ListAuditLogsQueryDto,
  ListAuditLogsResponseDto,
  GetAuditLogResponseDto,
  ExportAuditLogsQueryDto,
  ClearOldLogsRequestDto,
  ClearOldLogsResponseDto,
  AuditSummaryResponseDto,
  AuditActivityResponseDto,
  AuditDistributionResponseDto,
  AuditActivityPoint,
  AuditDistributionPoint
} from '@/types'

/**
 * List audit logs with filtering and pagination
 */
export async function listLogs(
  query: ListAuditLogsQueryDto
): Promise<ListAuditLogsResponseDto> {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 50
    } = query

    // Build where conditions
    const conditions = []
    
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId))
    }
    
    if (action) {
      conditions.push(eq(auditLogs.action, action))
    }
    
    if (resourceType) {
      conditions.push(eq(auditLogs.resourceType, resourceType))
    }
    
    if (resourceId) {
      conditions.push(eq(auditLogs.resourceId, resourceId))
    }
    
    if (startDate || endDate) {
      const dateConditions = []
      if (startDate) {
        dateConditions.push(gte(auditLogs.timestamp, new Date(startDate)))
      }
      if (endDate) {
        dateConditions.push(lte(auditLogs.timestamp, new Date(endDate)))
      }
      if (dateConditions.length > 0) {
        conditions.push(and(...dateConditions))
      }
    }
    
    if (search) {
      const searchValue = `%${search}%`
      conditions.push(or(
        like(auditLogs.action, searchValue),
        like(auditLogs.resourceType, searchValue),
        like(auditLogs.resourceName, searchValue),
        like(auditLogs.resourceId, searchValue),
        like(auditLogs.ipAddress, searchValue)
      ))
    }

    // Get total count
    const totalQuery = db.select({ count: count() }).from(auditLogs)
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions))
    }
    const totalResult = await totalQuery
    const total = totalResult[0]?.count || 0

    // Get paginated results with username join
    const offset = (page - 1) * limit
    
    const logs = await db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        username: users.username,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        resourceName: auditLogs.resourceName,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        timestamp: auditLogs.timestamp
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit)
      .offset(offset)

    // Transform database results to match DTO format
    const transformedLogs = logs.map(log => ({
      id: log.id,
      userId: log.userId,
      username: log.username || undefined,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId || undefined,
      resourceName: log.resourceName || undefined,
      details: log.details ? JSON.parse(log.details) : undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      timestamp: log.timestamp
    }))

    return {
      success: true,
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list audit logs'
    }
  }
}

/**
 * Get a specific audit log entry
 */
export async function getLog(id: string): Promise<GetAuditLogResponseDto> {
  try {
    const log = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1)
      .then(rows => rows[0])

    if (!log) {
      return {
        success: false,
        error: 'Audit log not found'
      }
    }

    return {
      success: true,
      log: {
        id: log.id,
        userId: log.userId,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId || undefined,
        resourceName: log.resourceName || undefined,
        details: log.details ? JSON.parse(log.details) : undefined,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        timestamp: log.timestamp
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit log'
    }
  }
}

/**
 * Export audit logs in JSON or CSV format
 */
export async function exportLogs(
  query: ExportAuditLogsQueryDto
): Promise<{ success: boolean; data?: string; filename?: string; error?: string }> {
  try {
    // Get all matching logs (higher limit for export)
    const exportQuery = { ...query, limit: 10000, page: 1 }
    const result = await listLogs(exportQuery)
    
    if (!result.success || !result.logs) {
      return {
        success: false,
        error: result.error || 'Failed to get logs for export'
      }
    }

    const { format = 'json', includeDetails = false } = query
    const logs = result.logs

    if (format === 'csv') {
      // CSV export
      const headers = ['Timestamp', 'User ID', 'Action', 'Resource Type', 'Resource ID', 'Resource Name', 'IP Address', 'User Agent']
      const csvRows = logs.map(log => [
        log.timestamp.toISOString(),
        log.userId,
        log.action,
        log.resourceType,
        log.resourceId || '',
        log.resourceName || '',
        log.ipAddress,
        log.userAgent || ''
      ])
      
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')),
      ].join('\n')

      return {
        success: true,
        data: csvContent,
        filename: `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      }
    } else {
      // JSON export
      const exportData = logs.map(log => ({
        ...log,
        details: includeDetails ? log.details : undefined
      }))

      return {
        success: true,
        data: JSON.stringify(exportData, null, 2),
        filename: `audit-logs-${new Date().toISOString().split('T')[0]}.json`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export audit logs'
    }
  }
}

function buildDateSeries(start: Date, end: Date) {
  const days: Date[] = []
  let cursor = startOfDay(start)
  const last = startOfDay(end)

  while (cursor <= last) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
  }

  return days
}

async function getDailyCounts(start: Date, end: Date) {
  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${auditLogs.timestamp}, 'unixepoch')`

  const rows = await db
    .select({
      day: dayExpr,
      count: count()
    })
    .from(auditLogs)
    .where(and(
      gte(auditLogs.timestamp, startOfDay(start)),
      lte(auditLogs.timestamp, endOfDay(end))
    ))
    .groupBy(dayExpr)

  const map = new Map<string, number>()
  rows.forEach(row => {
    map.set(row.day, Number(row.count))
  })

  return map
}

function formatActivityLabel(date: Date) {
  return format(date, 'MMM dd')
}

export async function getAuditSummary(): Promise<AuditSummaryResponseDto> {
  try {
    const totalRow = await db
      .select({
        total: count(),
        failedLogins: sql<number>`SUM(CASE WHEN ${auditLogs.action} = 'auth.login_failed' THEN 1 ELSE 0 END)`,
        successCount: sql<number>`SUM(CASE WHEN ${auditLogs.action} NOT LIKE '%failed%' AND ${auditLogs.action} NOT LIKE '%error%' THEN 1 ELSE 0 END)`
      })
      .from(auditLogs)

    const activeUsersRow = await db
      .select({
        activeUsers: sql<number>`COUNT(DISTINCT ${auditLogs.userId})`
      })
      .from(auditLogs)

    const totalEvents = Number(totalRow[0]?.total || 0)
    const successCount = Number(totalRow[0]?.successCount || 0)
    const failedLogins = Number(totalRow[0]?.failedLogins || 0)
    const activeUsers = Number(activeUsersRow[0]?.activeUsers || 0)
    const successRate = totalEvents > 0 ? Math.round((successCount / totalEvents) * 100) : 0

    return {
      success: true,
      summary: {
        totalEvents,
        activeUsers,
        successRate,
        failedLogins
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit summary'
    }
  }
}

export async function getAuditActivityLast7Days(): Promise<AuditActivityResponseDto> {
  try {
    const end = new Date()
    const start = subDays(end, 6)
    const counts = await getDailyCounts(start, end)
    const series = buildDateSeries(start, end)

    const points: AuditActivityPoint[] = series.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      return {
        date: formatActivityLabel(day),
        events: counts.get(key) ?? 0
      }
    })

    return { success: true, points }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load last 7 days activity'
    }
  }
}

export async function getAuditActivityLastMonth(): Promise<AuditActivityResponseDto> {
  try {
    const end = new Date()
    const start = subDays(end, 29)
    const counts = await getDailyCounts(start, end)
    const series = buildDateSeries(start, end)

    const points: AuditActivityPoint[] = series.map((day) => {
      const key = format(day, 'yyyy-MM-dd')
      return {
        date: formatActivityLabel(day),
        events: counts.get(key) ?? 0
      }
    })

    return { success: true, points }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load last month activity'
    }
  }
}

export async function getAuditActivityByWeek(): Promise<AuditActivityResponseDto> {
  try {
    const end = new Date()
    const start = subWeeks(end, 11)
    const dailyCounts = await getDailyCounts(start, end)

    const weekMap = new Map<string, number>()
    const weekLabels = new Map<string, string>()
    const series = buildDateSeries(start, end)

    series.forEach(day => {
      const weekStart = startOfWeek(day, { weekStartsOn: 1 })
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      weekLabels.set(weekKey, format(weekStart, 'MMM dd'))
      const dayKey = format(day, 'yyyy-MM-dd')
      weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + (dailyCounts.get(dayKey) ?? 0))
    })

    const points: AuditActivityPoint[] = Array.from(weekMap.keys()).sort().map((key) => ({
      date: weekLabels.get(key) || key,
      events: weekMap.get(key) ?? 0
    }))

    return { success: true, points }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load weekly activity'
    }
  }
}

export async function getAuditActivityByMonth(): Promise<AuditActivityResponseDto> {
  try {
    const end = new Date()
    const start = subMonths(end, 11)
    const startMonth = startOfMonth(start)
    const endMonth = endOfDay(end)
    const dailyCounts = await getDailyCounts(startMonth, endMonth)

    const monthMap = new Map<string, number>()
    const monthLabels = new Map<string, string>()
    let cursor = startMonth

    while (cursor <= endMonth) {
      const monthKey = format(cursor, 'yyyy-MM')
      monthLabels.set(monthKey, format(cursor, 'MMM yyyy'))
      monthMap.set(monthKey, 0)
      cursor = addMonths(cursor, 1)
    }

    buildDateSeries(startMonth, endMonth).forEach(day => {
      const monthKey = format(day, 'yyyy-MM')
      const dayKey = format(day, 'yyyy-MM-dd')
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + (dailyCounts.get(dayKey) ?? 0))
    })

    const points: AuditActivityPoint[] = Array.from(monthMap.keys()).sort().map((key) => ({
      date: monthLabels.get(key) || key,
      events: monthMap.get(key) ?? 0
    }))

    return { success: true, points }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load monthly activity'
    }
  }
}

function normalizeCategory(category: string) {
  if (!category) return 'Unknown'
  return category.charAt(0).toUpperCase() + category.slice(1)
}

export async function getAuditDistributionAllTime(): Promise<AuditDistributionResponseDto> {
  try {
    const categoryExpr = sql<string>`CASE WHEN instr(${auditLogs.action}, '.') > 0 THEN substr(${auditLogs.action}, 1, instr(${auditLogs.action}, '.') - 1) ELSE ${auditLogs.action} END`

    const rows = await db
      .select({
        category: categoryExpr,
        count: count()
      })
      .from(auditLogs)
      .groupBy(categoryExpr)

    const points: AuditDistributionPoint[] = rows.map(row => ({
      name: normalizeCategory(row.category),
      value: Number(row.count)
    }))

    return { success: true, points }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load distribution'
    }
  }
}

export async function getAuditDistributionLastMonth(): Promise<AuditDistributionResponseDto> {
  try {
    const start = subDays(new Date(), 29)
    const categoryExpr = sql<string>`CASE WHEN instr(${auditLogs.action}, '.') > 0 THEN substr(${auditLogs.action}, 1, instr(${auditLogs.action}, '.') - 1) ELSE ${auditLogs.action} END`

    const rows = await db
      .select({
        category: categoryExpr,
        count: count()
      })
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, startOfDay(start)))
      .groupBy(categoryExpr)

    const points: AuditDistributionPoint[] = rows.map(row => ({
      name: normalizeCategory(row.category),
      value: Number(row.count)
    }))

    return { success: true, points }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load distribution'
    }
  }
}

/**
 * Clear old audit logs
 */
export async function clearOldLogs(
  query: ClearOldLogsRequestDto
): Promise<ClearOldLogsResponseDto> {
  try {
    const { olderThan = 90, confirmation } = query

    // Validate confirmation
    if (confirmation !== 'CLEAR_OLD_LOGS') {
      return {
        success: false,
        error: 'Invalid confirmation'
      }
    }

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThan)
    cutoffDate.setHours(0, 0, 0, 0) // Start of day

    // Delete old logs
    await db.delete(auditLogs)
      .where(lte(auditLogs.timestamp, cutoffDate))

    // Get count of deleted logs
    const countResult = await db.select({ count: count() }).from(auditLogs)
      .where(lte(auditLogs.timestamp, cutoffDate))

    const logsDeleted = countResult[0]?.count || 0

    return {
      success: true,
      message: `Cleared ${logsDeleted} audit logs older than ${olderThan} days`,
      logsDeleted
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear old audit logs'
    }
  }
}
