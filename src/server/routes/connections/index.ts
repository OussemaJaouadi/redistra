import { Elysia, t } from 'elysia'
import { requireAuth } from '@/server/plugins/roles'
import {
  testConnection,
  listConnections,
  getConnection,
  createConnection,
  updateConnection,
  deleteConnection,
  connect,
  disconnect,
  testExistingConnection,
  getConnectionSecret,
} from '@/server/controllers/connections'
import { logAudit, getClientIP, getUserAgent } from '@/server/lib/audit'
import type {
  CreateConnectionResponseDto,
  UpdateConnectionResponseDto,
  DeleteConnectionResponseDto,
  TestConnectionResponseDto,
  ConnectResponseDto,
  DisconnectResponseDto,
  ListConnectionsResponseDto,
  GetConnectionResponseDto,
  GetConnectionSecretResponseDto,
} from '@/types'
import {
  createConnectionSchema,
  testConnectionSchema,
  updateConnectionSchema,
} from '@/types'

/**
 * Connection management routes
 */
export const connectionsRoutes = new Elysia({ prefix: '/connections' })
  .use(requireAuth())

  // Test connection (before save)
  .post('/test', async ({ body, set }): Promise<TestConnectionResponseDto> => {
    try {
      const result = await testConnection(body)
      if (!result.success) {
        set.status = 400
      }
      return result
    } catch (error) {
      console.error('Test connection error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to test connection',
      }
    }
  }, {
    body: testConnectionSchema,
  })

  // List connections (own + shared)
  .get('/', async ({ user, set }): Promise<ListConnectionsResponseDto> => {
    try {
      return await listConnections(user.id)
    } catch (error) {
      console.error('List connections error:', error)
      set.status = 500
      return {
        success: false,
        connections: { my: [], shared: [] },
        error: 'Failed to list connections',
      }
    }
  })

  // Get connection secret (password)
  .get('/:id/secret', async ({ params, user, set, request }): Promise<GetConnectionSecretResponseDto> => {
    try {
      const result = await getConnectionSecret(params.id, user.id, user.role)
      if (!result.success) {
        set.status = result.error === 'Connection not found' ? 404 : 403
        return result
      }

      await logAudit({
        userId: user.id,
        action: 'connection.password_viewed',
        resourceType: 'connection',
        resourceId: params.id,
        resourceName: 'Connection',
        details: JSON.stringify({}),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Get connection secret error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to get connection secret',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })

  // Get single connection
  .get('/:id', async ({ params, user, set }): Promise<GetConnectionResponseDto> => {
    try {
      const result = await getConnection(params.id, user.id, user.role)
      if (!result.success) {
        set.status = result.error === 'Connection not found' ? 404 : 403
      }
      return result
    } catch (error) {
      console.error('Get connection error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to get connection',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })

  // Create connection
  .post('/', async ({ body, user, set, request }): Promise<CreateConnectionResponseDto> => {
    try {
      const result = await createConnection(body, user.id, user.role)
      if (!result.success) {
        set.status = 400
        return result
      }

      // Log connection creation
      const isConnectionString = 'connectionString' in body
      await logAudit({
        userId: user.id,
        action: 'connection.created',
        resourceType: 'connection',
        resourceId: result.connection?.id,
        resourceName: body.name,
        details: JSON.stringify({
          host: isConnectionString ? 'connection-string' : body.host,
          database: isConnectionString ? 0 : (body.database || 0),
          isShared: body.isShared || false
        }),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Create connection error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to create connection',
      }
    }
  }, {
    body: createConnectionSchema,
  })

  // Update connection
  .patch('/:id', async ({ params, body, user, set, request }): Promise<UpdateConnectionResponseDto> => {
    try {
      const result = await updateConnection(params.id, body, user.id, user.role)
      if (!result.success) {
        set.status = result.error === 'Connection not found' ? 404 :
                     result.error === 'Access denied' ? 403 : 400
        return result
      }

      // Log connection update
      await logAudit({
        userId: user.id,
        action: 'connection.updated',
        resourceType: 'connection',
        resourceId: params.id,
        resourceName: body.name || 'Connection',
        details: JSON.stringify({
          updatedFields: Object.keys(body)
        }),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Update connection error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to update connection',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
    body: updateConnectionSchema,
  })

  // Delete connection
  .delete('/:id', async ({ params, user, set, request }): Promise<DeleteConnectionResponseDto> => {
    try {
      const result = await deleteConnection(params.id, user.id, user.role)
      if (!result.success) {
        set.status = result.error === 'Connection not found' ? 404 : 403
        return result
      }

      // Log connection deletion
      await logAudit({
        userId: user.id,
        action: 'connection.deleted',
        resourceType: 'connection',
        resourceId: params.id,
        resourceName: 'Connection',
        details: JSON.stringify({}),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Delete connection error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to delete connection',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })

  // Connect to Redis
  .post('/:id/connect', async ({ params, user, set }): Promise<ConnectResponseDto> => {
    try {
      const result = await connect(params.id, user.id, user.role)
      if (!result.success) {
        set.status = result.error === 'Connection not found' ? 404 : 
                     result.error === 'Access denied' ? 403 : 400
      }
      return result
    } catch (error) {
      console.error('Connect error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to connect',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })

  // Test existing connection (by ID)
  .post('/:id/test', async ({ params, user, set }): Promise<TestConnectionResponseDto> => {
    try {
      const result = await testExistingConnection(params.id, user.id, user.role)
      if (!result.success) {
        set.status = result.error === 'Connection not found' ? 404 : 
                     result.error === 'Access denied' ? 403 : 400
      }
      return result
    } catch (error) {
      console.error('Test existing connection error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to test connection',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })

  // Disconnect from Redis
  .post('/:id/disconnect', async ({ params, set }): Promise<DisconnectResponseDto> => {
    try {
      return await disconnect(params.id)
    } catch (error) {
      console.error('Disconnect error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to disconnect',
      }
    }
  }, {
    params: t.Object({ id: t.String() }),
  })
