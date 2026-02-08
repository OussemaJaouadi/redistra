/**
 * Audit Logging Validation Schemas
 */

import { t } from 'elysia'

/**
 * List Audit Logs Query Schema
 */
export const listAuditLogsSchema = t.Object({
  userId: t.Optional(t.String()),
  action: t.Optional(t.String()),
  resourceType: t.Optional(t.String()),
  resourceId: t.Optional(t.String()),
  startDate: t.Optional(t.String({
    minLength: 1,
    maxLength: 50,
    error: 'Start date must be valid ISO 8601 format'
  })),
  endDate: t.Optional(t.String({
    minLength: 1,
    maxLength: 50,
    error: 'End date must be valid ISO 8601 format'
  })),
  search: t.Optional(t.String({
    minLength: 1,
    maxLength: 100,
    error: 'Search query must be 1-100 characters'
  })),
  page: t.Optional(t.Integer({
    minimum: 1,
    default: 1,
    error: 'Page must be at least 1'
  })),
  limit: t.Optional(t.Integer({
    minimum: 1,
    maximum: 1000,
    default: 50,
    error: 'Limit must be between 1 and 1000'
  }))
})

/**
 * Export Audit Logs Query Schema
 */
export const exportAuditLogsSchema = t.Object({
  userId: t.Optional(t.String()),
  action: t.Optional(t.String()),
  resourceType: t.Optional(t.String()),
  resourceId: t.Optional(t.String()),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  search: t.Optional(t.String()),
  includeDetails: t.Optional(t.Boolean({
    default: false
  })),
  format: t.Union([
    t.Literal('json'),
    t.Literal('csv')
  ], {
    default: 'json',
    error: 'Format must be json or csv'
  }),
  page: t.Optional(t.Integer({
    minimum: 1,
    default: 1
  })),
  limit: t.Optional(t.Integer({
    minimum: 1,
    maximum: 1000,
    default: 1000,
    error: 'Export limit must be between 1 and 1000'
  }))
})

/**
 * Clear Old Logs Schema
 */
export const clearOldLogsSchema = t.Object({
  olderThan: t.Optional(t.Integer({
    minimum: 1,
    maximum: 365,
    default: 90,
    error: 'Days must be between 1 and 365'
  })),
  confirmation: t.Literal('CLEAR_OLD_LOGS', {
    error: 'Confirmation must be exactly "CLEAR_OLD_LOGS"'
  })
})

/**
 * Response schemas for audit operations
 */
export const auditLogSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  action: t.String(),
  resourceType: t.String(),
  resourceId: t.Optional(t.String()),
  resourceName: t.Optional(t.String()),
  details: t.Optional(t.String()),
  ipAddress: t.String(),
  userAgent: t.Optional(t.String()),
  timestamp: t.String()
})

export const listAuditLogsResponseSchema = t.Object({
  success: t.Boolean(),
  logs: t.Optional(t.Array(auditLogSchema)),
  pagination: t.Optional(t.Object({
    page: t.Integer(),
    limit: t.Integer(),
    total: t.Integer(),
    totalPages: t.Integer()
  })),
  error: t.Optional(t.String())
})

export const getAuditLogResponseSchema = t.Object({
  success: t.Boolean(),
  log: t.Optional(auditLogSchema),
  error: t.Optional(t.String())
})

export const clearOldLogsResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.Optional(t.String()),
  logsDeleted: t.Optional(t.Integer()),
  error: t.Optional(t.String())
})

export const auditSummaryResponseSchema = t.Object({
  success: t.Boolean(),
  summary: t.Optional(t.Object({
    totalEvents: t.Integer(),
    activeUsers: t.Integer(),
    successRate: t.Integer(),
    failedLogins: t.Integer()
  })),
  error: t.Optional(t.String())
})

export const auditActivityResponseSchema = t.Object({
  success: t.Boolean(),
  points: t.Optional(t.Array(t.Object({
    date: t.String(),
    events: t.Integer()
  }))),
  error: t.Optional(t.String())
})

export const auditDistributionResponseSchema = t.Object({
  success: t.Boolean(),
  points: t.Optional(t.Array(t.Object({
    name: t.String(),
    value: t.Integer()
  }))),
  error: t.Optional(t.String())
})
