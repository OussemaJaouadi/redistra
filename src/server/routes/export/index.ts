/**
 * Export Routes
 * HTTP handlers for export download operations
 */

import { Elysia, t } from 'elysia'
import { requireAuth } from '@/server/plugins/roles'
import { getExportStatus } from '@/server/controllers/export'
import { exportJobs } from '@/server/controllers/export'
import type { ExportStatusResponseDto } from '@/types'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

/**
 * Export routes - require authentication
 */
export const exportRoutes = new Elysia({ prefix: '/export' })
  .use(requireAuth())

  /**
   * Get export status
   * GET /api/export/:id/status
   */
  .get(
    '/:id/status',
    async ({ params, user, set }): Promise<ExportStatusResponseDto> => {
      try {
        const result = await getExportStatus(user!.id, params.id)
        
        if (!result.success) {
          set.status = result.error === 'Export not found' ? 404 : 403
        }
        
        return result as ExportStatusResponseDto
      } catch (error) {
        console.error('Get export status error:', error)
        set.status = 500
        return {
          success: false,
          error: 'Failed to get export status'
        } as ExportStatusResponseDto
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )

  /**
   * Download export file
   * GET /api/export/:id/download
   */
  .get(
    '/:id/download',
    async ({ params, user, set }): Promise<Response> => {
      try {
        const job = exportJobs.get(params.id)
        
        if (!job) {
          set.status = 404
          return new Response('Export not found', { status: 404 })
        }

        if (job.userId !== user!.id) {
          set.status = 403
          return new Response('Access denied', { status: 403 })
        }

        if (job.status !== 'completed') {
          set.status = 400
          return new Response(`Export is ${job.status}`, { status: 400 })
        }

        if (!job.filePath) {
          set.status = 404
          return new Response('Export file not found', { status: 404 })
        }

        // Check if file exists
        try {
          await stat(job.filePath)
        } catch {
          set.status = 404
          return new Response('Export file not found', { status: 404 })
        }

        // Determine content type based on file extension
        const ext = job.filePath.split('.').pop()?.toLowerCase()
        let contentType = 'application/octet-stream'
        
        switch (ext) {
          case 'json':
            contentType = 'application/json'
            break
          case 'csv':
            contentType = 'text/csv'
            break
          case 'rdb':
            contentType = 'application/octet-stream'
            break
        }

        // Create readable stream
        const stream = createReadStream(job.filePath)
        
        // Get file stats for content-length
        const stats = await stat(job.filePath)

        // Return file as response
        const body = stream as unknown as ReadableStream<Uint8Array>
        return new Response(body, {
          headers: {
            'Content-Type': contentType,
            'Content-Length': stats.size.toString(),
            'Content-Disposition': `attachment; filename="export-${params.id}.${ext}"`,
          },
        })
      } catch (error) {
        console.error('Download export error:', error)
        set.status = 500
        return new Response('Failed to download export', { status: 500 })
      }
    },
    {
      params: t.Object({
        id: t.String()
      })
    }
  )
