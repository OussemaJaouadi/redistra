/**
 * Audit Logging DTOs
 */


/**
 * Audit log entry
 */
export interface AuditLog {
  id: string
  userId: string | null
  username?: string // Username for display (joined from users table)
  action: string // e.g., 'user.created', 'key.deleted', 'database.flushed'
  resourceType: string // e.g., 'user', 'connection', 'key', 'database'
  resourceId?: string // ID of the affected resource
  resourceName?: string // Human-readable name of the resource
  details?: string // JSON string with additional details
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

/**
 * List Audit Logs Query
 */
export interface ListAuditLogsQueryDto {
  userId?: string // Filter by user
  action?: string // Filter by action type
  resourceType?: string // Filter by resource type
  resourceId?: string // Filter by resource ID
  startDate?: string // ISO date string
  endDate?: string // ISO date string
  search?: string // Search in details JSON
  page?: number // Page number (default: 1)
  limit?: number // Items per page (default: 50, max: 1000)
}

export type ListAuditLogsResponseDto = {
  success: boolean
  logs?: AuditLog[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

/**
 * Get Audit Log Response
 */
export type GetAuditLogResponseDto = {
  success: boolean
  log?: AuditLog
  error?: string
}

/**
 * Export Audit Logs Query
 */
export interface ExportAuditLogsQueryDto extends ListAuditLogsQueryDto {
  format?: 'json' | 'csv' // Export format
  includeDetails?: boolean // Include details JSON in export
}

/**
 * Clear Old Logs Request
 */
export interface ClearOldLogsRequestDto {
  olderThan?: number // Clear logs older than N days (default: 90)
  confirmation: string // Must match "CLEAR_OLD_LOGS"
}

/**
 * Clear Old Logs Response
 */
export type ClearOldLogsResponseDto = {
  success: boolean
  message?: string
  logsDeleted?: number
  error?: string
}

/**
 * Audit summary + charts
 */
export interface AuditSummaryDto {
  totalEvents: number
  activeUsers: number
  successRate: number
  failedLogins: number
}

export type AuditSummaryResponseDto = {
  success: boolean
  summary?: AuditSummaryDto
  error?: string
}

export interface AuditActivityPoint {
  date: string
  events: number
}

export type AuditActivityResponseDto = {
  success: boolean
  points?: AuditActivityPoint[]
  error?: string
}

export interface AuditDistributionPoint {
  name: string
  value: number
}

export type AuditDistributionResponseDto = {
  success: boolean
  points?: AuditDistributionPoint[]
  error?: string
}
