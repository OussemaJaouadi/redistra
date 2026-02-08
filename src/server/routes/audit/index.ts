/**
 * Audit Routes
 * HTTP handlers for audit log operations
 */

import { Elysia, t } from 'elysia'
import { requireRole } from '@/server/plugins/roles'
import {
  listLogs,
  getLog,
  exportLogs,
  clearOldLogs,
  getAuditSummary,
  getAuditActivityLast7Days,
  getAuditActivityLastMonth,
  getAuditActivityByWeek,
  getAuditActivityByMonth,
  getAuditDistributionAllTime,
  getAuditDistributionLastMonth
} from '@/server/controllers/audit'
import {
  listAuditLogsSchema,
  exportAuditLogsSchema,
  clearOldLogsSchema
} from '@/types'
import type {
  ListAuditLogsQueryDto,
  ListAuditLogsResponseDto,
  GetAuditLogResponseDto,
  ExportAuditLogsQueryDto,
  ClearOldLogsRequestDto,
  ClearOldLogsResponseDto,
  AuditSummaryResponseDto,
  AuditActivityResponseDto,
  AuditDistributionResponseDto
} from '@/types'

/**
 * Audit routes - admin only access
 */
export const auditRoutes = new Elysia({ prefix: '/audit' })
  .use(requireRole('admin'))

  /**
   * List audit logs
   * GET /api/audit
   */
  .get(
    '/',
    async ({ query, set }) => {
      try {
        const result = await listLogs(query as ListAuditLogsQueryDto)

        // Note: Export functionality is handled by the separate /export endpoint
        // This endpoint is for listing only

        return result as ListAuditLogsResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list audit logs'
        } as ListAuditLogsResponseDto
      }
    },
    {
      query: listAuditLogsSchema
    }
  )

  /**
   * Audit summary
   * GET /api/audit/summary
   */
  .get(
    '/summary',
    async ({ set }) => {
      try {
        return await getAuditSummary() as AuditSummaryResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load audit summary'
        } as AuditSummaryResponseDto
      }
    }
  )

  /**
   * Activity chart: last 7 days
   * GET /api/audit/charts/activity/last-7-days
   */
  .get(
    '/charts/activity/last-7-days',
    async ({ set }) => {
      try {
        return await getAuditActivityLast7Days() as AuditActivityResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load activity'
        } as AuditActivityResponseDto
      }
    }
  )

  /**
   * Activity chart: last month
   * GET /api/audit/charts/activity/last-month
   */
  .get(
    '/charts/activity/last-month',
    async ({ set }) => {
      try {
        return await getAuditActivityLastMonth() as AuditActivityResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load activity'
        } as AuditActivityResponseDto
      }
    }
  )

  /**
   * Activity chart: by week
   * GET /api/audit/charts/activity/by-week
   */
  .get(
    '/charts/activity/by-week',
    async ({ set }) => {
      try {
        return await getAuditActivityByWeek() as AuditActivityResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load activity'
        } as AuditActivityResponseDto
      }
    }
  )

  /**
   * Activity chart: by month
   * GET /api/audit/charts/activity/by-month
   */
  .get(
    '/charts/activity/by-month',
    async ({ set }) => {
      try {
        return await getAuditActivityByMonth() as AuditActivityResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load activity'
        } as AuditActivityResponseDto
      }
    }
  )

  /**
   * Distribution chart: all time
   * GET /api/audit/charts/distribution/all-time
   */
  .get(
    '/charts/distribution/all-time',
    async ({ set }) => {
      try {
        return await getAuditDistributionAllTime() as AuditDistributionResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load distribution'
        } as AuditDistributionResponseDto
      }
    }
  )

  /**
   * Distribution chart: last month
   * GET /api/audit/charts/distribution/last-month
   */
  .get(
    '/charts/distribution/last-month',
    async ({ set }) => {
      try {
        return await getAuditDistributionLastMonth() as AuditDistributionResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load distribution'
        } as AuditDistributionResponseDto
      }
    }
  )

  /**
   * Get specific audit log
   * GET /api/audit/:id
   */
  .get(
    '/:id',
    async ({ params, set }) => {
      try {
        const result = await getLog(params.id)
        
        return result as GetAuditLogResponseDto
      } catch (error) {
        set.status = 404
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get audit log'
        } as GetAuditLogResponseDto
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )

  /**
   * Export audit logs
   * POST /api/audit/export
   */
  .post(
    '/export',
    async ({ body, set }) => {
      try {
        const result = await exportLogs(body as ExportAuditLogsQueryDto)
        
        if (!result.success) {
          set.status = 500
          return {
            success: false,
            error: result.error
          }
        }

        // Set download headers
        const filename = result.filename || 'audit-logs.json'
        const headers = new Headers()
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)
        headers.set('Content-Type', body.format === 'csv' ? 'text/csv' : 'application/json')

        return new Response(result.data, {
          status: 200,
          headers: headers
        })
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to export audit logs'
        }
      }
    },
    {
      body: exportAuditLogsSchema
    }
  )

  /**
   * Clear old audit logs
   * POST /api/audit/clear
   */
  .post(
    '/clear',
    async ({ body, set }) => {
      try {
        const result = await clearOldLogs(body as ClearOldLogsRequestDto)
        
        return result as ClearOldLogsResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to clear old audit logs'
        }
      }
    },
    {
      body: clearOldLogsSchema
    }
  )
