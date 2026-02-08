/**
 * Redis Operations Routes
 * HTTP handlers that call Redis controllers
 */

import { Elysia, t } from 'elysia'
import { requireAuth } from '@/server/plugins/roles'
import { db } from '@/db'
import { connections } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { decrypt } from '@/server/lib/encryption'
import { getRedisConnection } from '@/server/lib/redis-pool'
import {
  listKeys,
  getKey,
  createKey,
  updateKey,
  deleteKey,
  setTtl,
  renameKey,
  bulkDelete,
  listDatabases,
  getDatabaseInfo,
  getRedisInfo,
  selectDatabase,
  flushDatabase,
  flushAll
} from '@/server/controllers/redis'
import {
  listKeysSchema,
  getKeySchema,
  createKeySchema,
  updateKeySchema,
  deleteKeySchema,
  setTtlSchema,
  renameKeySchema,
  bulkDeleteSchema,
  selectDatabaseSchema,
  flushDatabaseSchema,
  flushAllSchema
} from '@/types'
import { logAudit, getClientIP, getUserAgent } from '@/server/lib/audit'
import type { 
  ListKeysQueryDto,
  ListKeysResponseDto,
  GetKeyResponseDto,
  CreateKeyRequestDto,
  CreateKeyResponseDto,
  UpdateKeyRequestDto,
  UpdateKeyResponseDto,
  DeleteKeyResponseDto,
  SetTtlRequestDto,
  SetTtlResponseDto,
  RenameKeyRequestDto,
  RenameKeyResponseDto,
  BulkDeleteRequestDto,
  BulkDeleteResponseDto,
  ListDatabasesResponseDto,
  GetDatabaseInfoResponseDto,
  RedisInfoResponseDto,
  SelectDatabaseRequestDto,
  SelectDatabaseResponseDto,
  FlushDatabaseResponseDto,
  FlushAllResponseDto
} from '@/types'

/**
 * Get connection configuration and validate access
 */
async function getConnectionConfig(
  connectionId: string,
  userId: string,
  userRole: string
) {
  const connection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  if (!connection) {
    throw new Error('Connection not found')
  }

  // Check access: must be owner or connection must be shared or user is admin
  if (
    connection.ownerId !== userId &&
    !connection.isShared &&
    userRole !== 'admin'
  ) {
    throw new Error('Access denied')
  }

  // Create connection config with decrypted password
  const connectionConfig = {
    id: connection.id,
    host: connection.host,
    port: connection.port,
    password: connection.passwordEnc ? await decrypt(connection.passwordEnc) : undefined,
    username: connection.username || undefined,
    database: connection.database,
    useTls: connection.useTls
  }

  return connectionConfig
}

function applyRedisErrorStatus(set: { status?: number | string }, message: string) {
  if (message === 'Access denied') {
    set.status = 403
    return
  }

  if (message === 'Connection not found') {
    set.status = 404
    return
  }

  if (
    message.startsWith('Insufficient permissions') ||
    message.startsWith('Admin privileges required')
  ) {
    set.status = 403
  }
}

/**
 * Redis operations routes
 * All routes require authentication
 * Write operations require Editor or Admin role
 */
export const redisRoutes = new Elysia({ prefix: '/redis' })
  .use(requireAuth())

  /**
   * List keys using SCAN
   * GET /api/redis/:connId/keys
   */
  .get(
    '/:connId/keys',
    async ({ params, query, user, set }) => {
      try {
        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, (query as ListKeysQueryDto)?.db)
        const result = await listKeys(redis, query as ListKeysQueryDto)
        
        return result as ListKeysResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list keys'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as ListKeysResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String()
      }),
      query: listKeysSchema
    }
  )

  /**
   * Get key details and value
   * GET /api/redis/:connId/key/:key
   */
  .get(
    '/:connId/key/:key',
    async ({ params, query, user, set }) => {
      try {
        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, query?.db)
        const result = await getKey(redis, params.key, query?.db)
        
        return result as GetKeyResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get key'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as GetKeyResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        key: t.String()
      }),
      query: getKeySchema
    }
  )

  /**
   * Create a new key
   * POST /api/redis/:connId/key
   */
  .post(
    '/:connId/key',
    async ({ params, user, set, request, body }) => {
      try {
        // Check user permissions - only Editors and Admins can create keys
        if (user?.role === 'viewer') {
          set.status = 403
          return {
            success: false,
            error: 'Insufficient permissions to create keys'
          } as CreateKeyResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, (body as CreateKeyRequestDto)?.db)
        const result = await createKey(redis, body as CreateKeyRequestDto)

        // Log key creation
        if (result.success) {
          await logAudit({
            userId: user!.id,
            action: 'key.created',
            resourceType: 'key',
            resourceId: body.key,
            resourceName: body.key,
            details: JSON.stringify({
              type: body.type,
              database: body.db || 0,
              connectionId: params.connId
            }),
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request)
          })
        }

        return result as CreateKeyResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create key'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as CreateKeyResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String()
      }),
      body: createKeySchema
    }
  )

  /**
   * Update an existing key
   * PUT /api/redis/:connId/key/:key
   */
  .put(
    '/:connId/key/:key',
    async ({ params, user, set, request, body }) => {
      try {
        // Check user permissions - only Editors and Admins can update keys
        if (user?.role === 'viewer') {
          set.status = 403
          return {
            success: false,
            error: 'Insufficient permissions to update keys'
          } as UpdateKeyResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, (body as UpdateKeyRequestDto)?.db)
        const result = await updateKey(redis, params.key, body as UpdateKeyRequestDto)
        
        // Log key update
        if (result.success) {
          await logAudit({
            userId: user!.id,
            action: 'key.updated',
            resourceType: 'key',
            resourceId: params.key,
            resourceName: params.key,
            details: JSON.stringify({
              database: body.db || 0,
              connectionId: params.connId
            }),
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request)
          })
        }
        
        return result as UpdateKeyResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update key'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as UpdateKeyResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        key: t.String()
      }),
      body: updateKeySchema
    }
  )

  /**
   * Delete a key
   * DELETE /api/redis/:connId/key/:key
   */
  .delete(
    '/:connId/key/:key',
    async ({ params, query, user, set, request }) => {
      try {
        // Check user permissions - only Editors and Admins can delete keys
        if (user?.role === 'viewer') {
          set.status = 403
          return {
            success: false,
            error: 'Insufficient permissions to delete keys'
          } as DeleteKeyResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, query?.db)
        const result = await deleteKey(redis, params.key, query?.db)
        
        // Log key deletion
        if (result.success) {
          await logAudit({
            userId: user!.id,
            action: 'key.deleted',
            resourceType: 'key',
            resourceId: params.key,
            resourceName: params.key,
            details: JSON.stringify({
              database: query?.db || 0,
              connectionId: params.connId
            }),
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request)
          })
        }
        
        return result as DeleteKeyResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete key'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as DeleteKeyResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        key: t.String()
      }),
      query: deleteKeySchema
    }
  )

  /**
   * Set TTL on a key
   * PATCH /api/redis/:connId/key/:key/ttl
   */
  .patch(
    '/:connId/key/:key/ttl',
    async ({ params, body, user, set }) => {
      try {
        // Check user permissions - only Editors and Admins can modify TTL
        if (user?.role === 'viewer') {
          set.status = 403
          return {
            success: false,
            error: 'Insufficient permissions to modify TTL'
          } as SetTtlResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, (body as SetTtlRequestDto)?.db)
        const result = await setTtl(redis, params.key, body as SetTtlRequestDto)
        
        return result as SetTtlResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to set TTL'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as SetTtlResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        key: t.String()
      }),
      body: setTtlSchema
    }
  )

  /**
   * Rename a key
   * POST /api/redis/:connId/key/:key/rename
   */
  .post(
    '/:connId/key/:key/rename',
    async ({ params, user, set, request, body }) => {
      try {
        // Check user permissions - only Editors and Admins can rename keys
        if (user?.role === 'viewer') {
          set.status = 403
          return {
            success: false,
            error: 'Insufficient permissions to rename keys'
          } as RenameKeyResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, (body as RenameKeyRequestDto)?.db)
        const result = await renameKey(redis, params.key, body as RenameKeyRequestDto)
        
        // Log key rename
        if (result.success) {
          await logAudit({
            userId: user!.id,
            action: 'key.renamed',
            resourceType: 'key',
            resourceId: params.key,
            resourceName: params.key,
            details: JSON.stringify({
              newKey: body.newKey,
              database: body.db || 0,
              connectionId: params.connId
            }),
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request)
          })
        }
        
        return result as RenameKeyResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to rename key'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as RenameKeyResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        key: t.String()
      }),
      body: renameKeySchema
    }
  )

  /**
   * Bulk delete keys
   * POST /api/redis/:connId/keys/delete
   */
  .post(
    '/:connId/keys/delete',
    async ({ params, user, set, request, body }) => {
      try {
        // Check user permissions - only Editors and Admins can delete keys
        if (user?.role === 'viewer') {
          set.status = 403
          return {
            success: false,
            error: 'Insufficient permissions to delete keys'
          } as BulkDeleteResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, (body as BulkDeleteRequestDto)?.db)
        const result = await bulkDelete(redis, body as BulkDeleteRequestDto)
        
        // Log bulk delete
        if (result.success) {
          await logAudit({
            userId: user!.id,
            action: 'bulk.keys_deleted',
            resourceType: 'key',
            resourceId: params.connId,
            resourceName: `Bulk Delete (${result.deleted} keys)`,
            details: JSON.stringify({
              deleted: result.deleted,
              failed: result.failed?.length || 0,
              database: body.db || 0,
              connectionId: params.connId
            }),
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request)
          })
        }
        
        return result as BulkDeleteResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to bulk delete keys'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as BulkDeleteResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String()
      }),
      body: bulkDeleteSchema
    }
  )

  /**
   * List all databases with statistics
   * GET /api/redis/:connId/databases
   */
  .get(
    '/:connId/info',
    async ({ params, user, set }) => {
      try {
        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig)
        const result = await getRedisInfo(redis)

        return result as RedisInfoResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get Redis info'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as RedisInfoResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String()
      })
    }
  )

  .get(
    '/:connId/databases',
    async ({ params, user, set }) => {
      try {
        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig)
        const result = await listDatabases(redis)
        
        return result as ListDatabasesResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list databases'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as ListDatabasesResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String()
      })
    }
  )

  /**
   * Get specific database info
   * GET /api/redis/:connId/database/:db
   */
  .get(
    '/:connId/database/:db',
    async ({ params, user, set }) => {
      try {
        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, parseInt(params.db))
        const result = await getDatabaseInfo(redis, parseInt(params.db))
        
        return result as GetDatabaseInfoResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get database info'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as GetDatabaseInfoResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        db: t.String()
      })
    }
  )

  /**
   * Switch to database
   * POST /api/redis/:connId/database/:db/select
   */
  .post(
    '/:connId/database/:db/select',
    async ({ params, body, user, set }) => {
      try {
        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, parseInt(params.db))
        const result = await selectDatabase(redis, body as SelectDatabaseRequestDto)
        
        return result as SelectDatabaseResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to select database'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as SelectDatabaseResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        db: t.String()
      }),
      body: selectDatabaseSchema
    }
  )

  /**
   * Flush database (admin only)
   * POST /api/redis/:connId/database/:db/flush
   */
  .post(
    '/:connId/database/:db/flush',
    async ({ params, body, user, set, request }) => {
      try {
        // Check admin permissions
        if (user?.role !== 'admin') {
          set.status = 403
          return {
            success: false,
            error: 'Admin privileges required to flush database'
          } as FlushDatabaseResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig, parseInt(params.db))
        const result = await flushDatabase(redis, parseInt(params.db), body.confirmation)
        
        // Log database flush
        if (result.success) {
          await logAudit({
            userId: user!.id,
            action: 'database.flushed',
            resourceType: 'database',
            resourceId: params.connId,
            resourceName: `Database ${params.db}`,
            details: JSON.stringify({
              database: parseInt(params.db),
              keysDeleted: result.keysDeleted,
              connectionId: params.connId
            }),
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request)
          })
        }
        
        return result as FlushDatabaseResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to flush database'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as FlushDatabaseResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String(),
        db: t.String()
      }),
      body: flushDatabaseSchema
    }
  )

  /**
   * Flush all databases (admin only)
   * POST /api/redis/:connId/flush-all
   */
  .post(
    '/:connId/flush-all',
    async ({ params, user, set, request }) => {
      try {
        // Check admin permissions
        if (user?.role !== 'admin') {
          set.status = 403
          return {
            success: false,
            error: 'Admin privileges required to flush all databases'
          } as FlushAllResponseDto
        }

        const connectionConfig = await getConnectionConfig(
          params.connId,
          user!.id,
          user!.role
        )

        const redis = await getRedisConnection(connectionConfig)
        const result = await flushAll(redis)
        
        // Log flush all
        if (result.success) {
          await logAudit({
            userId: user!.id,
            action: 'database.flushed_all',
            resourceType: 'database',
            resourceId: params.connId,
            resourceName: 'All Databases',
            details: JSON.stringify({
              totalKeysDeleted: result.totalKeysDeleted,
              databasesAffected: result.databasesAffected,
              connectionId: params.connId
            }),
            ipAddress: getClientIP(request),
            userAgent: getUserAgent(request)
          })
        }
        
        return result as FlushAllResponseDto
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to flush all databases'
        applyRedisErrorStatus(set, message)
        return {
          success: false,
          error: message
        } as FlushAllResponseDto
      }
    },
    {
      params: t.Object({
        connId: t.String()
      }),
      body: flushAllSchema
    }
  )
