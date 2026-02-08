/**
 * Import Routes
 * HTTP handlers for data import operations
 */

import { Elysia, t } from 'elysia'
import { requireAuth, requireRole } from '@/server/plugins/roles'
import { getClientIP, getUserAgent } from '@/server/lib/audit'
import {
  importKeys,
  importConnection,
  importRDB
} from '@/server/controllers/import'
import {
  importKeysSchema,
  importConnectionSchema,
  importRDBSchema
} from '@/types'
import type {
  ImportKeysRequestDto,
  ImportConnectionRequestDto,
  ImportRDBRequestDto,
  ImportKeysResponseDto,
  ImportConnectionResponseDto,
  ImportRDBResponseDto
} from '@/types'

/**
 * Import routes - require authentication
 */
export const importRoutes = new Elysia({ prefix: '/import' })
  .use(requireAuth())

  /**
   * Import keys from file
   * POST /api/import/keys
   */
  .post(
    '/keys',
    async ({ body, user, request, set }) => {
      try {
        const ipAddress = getClientIP(request)
        const userAgent = getUserAgent(request)

        // Parse file content from body
        const { fileContent, ...payload } = body

        const result = await importKeys(
          user!.id,
          payload as ImportKeysRequestDto,
          fileContent as string,
          ipAddress,
          userAgent
        )

        return result as ImportKeysResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to import keys'
        } as ImportKeysResponseDto
      }
    },
    {
      body: t.Object({
        ...importKeysSchema.properties,
        fileContent: t.String({
          error: 'File content is required'
        })
      })
    }
  )

  /**
   * Import connection configuration
   * POST /api/import/connection
   */
  .post(
    '/connection',
    async ({ body, user, request, set }) => {
      try {
        const ipAddress = getClientIP(request)
        const userAgent = getUserAgent(request)

        const result = await importConnection(
          user!.id,
          body as ImportConnectionRequestDto,
          ipAddress,
          userAgent
        )

        return result as ImportConnectionResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to import connection'
        } as ImportConnectionResponseDto
      }
    },
    {
      body: importConnectionSchema
    }
  )

/**
 * RDB Import routes - admin only
 */
export const rdbImportRoutes = new Elysia({ prefix: '/import' })
  .use(requireRole('admin'))

  /**
   * Import RDB file (Admin Only)
   * POST /api/import/rdb
   */
  .post(
    '/rdb',
    async ({ body, user, request, set }) => {
      try {
        const ipAddress = getClientIP(request)
        const userAgent = getUserAgent(request)

        // Parse file content from body
        const fileContent = body.fileContent as string
        const fileBuffer = Buffer.from(fileContent, 'base64')

        const result = await importRDB(
          user!.id,
          body as ImportRDBRequestDto,
          fileBuffer,
          ipAddress,
          userAgent
        )

        return result as ImportRDBResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to import RDB file'
        } as ImportRDBResponseDto
      }
    },
    {
      body: t.Object({
        ...importRDBSchema.properties,
        fileContent: t.String({
          error: 'File content is required'
        })
      })
    }
  )
