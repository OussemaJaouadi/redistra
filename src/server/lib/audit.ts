/**
 * Audit Logging Library
 * Helper functions for logging audit events
 */

import { db } from '@/db'
import { auditLogs } from '@/db/schema'
import type { AuditLog } from '@/types'

/**
 * Log an audit event
 */
export async function logAudit(data: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: data.userId,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      resourceName: data.resourceName,
      details: JSON.stringify(data.details || {}),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent || 'Unknown',
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    '127.0.0.1' // fallback
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'Unknown'
}

/**
 * Mask sensitive data in audit details
 */
export function maskSensitiveData(details: Record<string, unknown>): Record<string, unknown> {
  const masked = { ...details }

  // Mask common sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential']

  sensitiveFields.forEach(field => {
    if (field in masked) {
      masked[field] = '[REDACTED]'
    }
  })

  return masked
}
