/**
 * Connection Controllers
 * Handles Redis connection management and operations
 */

import { db } from '@/db'
import { connections } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { encrypt, decrypt } from '@/server/lib/encryption'
import { parseConnectionString, isValidConnectionString } from '@/server/lib/connection-string-parser'
import { nanoid } from 'nanoid'
import { getRedisConnection, disconnectRedis, testRedisConnection } from '@/server/lib/redis-pool'
import type {
  ConnectionConfig,
  CreateConnectionRequestDto,
  CreateConnectionResponseDto,
  UpdateConnectionRequestDto,
  UpdateConnectionResponseDto,
  DeleteConnectionResponseDto,
  TestConnectionRequestDto,
  TestConnectionResponseDto,
  ConnectResponseDto,
  DisconnectResponseDto,
  ListConnectionsResponseDto,
  GetConnectionResponseDto,
  GetConnectionSecretResponseDto,
  ParsedConnection
} from '@/types'

/**
 * Validate host format (simple check for IP or hostname)
 */
function isValidHost(host: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/
  // Hostname pattern
  const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (host === 'localhost') return true
  if (ipv4Pattern.test(host)) {
    const parts = host.split('.')
    return parts.every(part => parseInt(part, 10) <= 255)
  }
  return hostnamePattern.test(host)
}

/**
 * Test connection before saving
 */
export async function testConnection(data: TestConnectionRequestDto): Promise<TestConnectionResponseDto> {
  let config: ParsedConnection

  // Parse connection string if provided
  if ('connectionString' in data) {
    if (!isValidConnectionString(data.connectionString)) {
      return { success: false, error: 'Invalid connection string format' }
    }
    config = parseConnectionString(data.connectionString)
  } else {
    config = {
      host: data.host,
      port: data.port || 6379,
      password: data.password,
      username: data.username,
      database: data.database || 0,
      useTls: data.useTls || false,
    }
  }

  // Validate host format
  if (!isValidHost(config.host)) {
    return { success: false, error: 'Invalid host format' }
  }

  const startTime = Date.now()
  const testResult = await testRedisConnection({
    id: 'test-' + nanoid(8),
    ...config,
  })
  const latencyMs = Date.now() - startTime

  if (testResult.success) {
    return {
      success: true,
      latencyMs,
      serverInfo: testResult.info,
    }
  }

  return {
    success: false,
    error: testResult.error,
  }
}

/**
 * List all connections for user
 */
export async function listConnections(userId: string): Promise<ListConnectionsResponseDto> {
  // Fetch user's own connections
  const myConnections = await db
    .select()
    .from(connections)
    .where(eq(connections.ownerId, userId))
    .orderBy(desc(connections.lastUsed))

  // Fetch shared connections (if not admin, only shared ones)
  const sharedConnections = await db
    .select()
    .from(connections)
    .where(
      and(
        eq(connections.isShared, true),
        // Don't include user's own connections again
        // Only include if owner is not current user
        // SQL: ownerId != userId
      )
    )
    .orderBy(desc(connections.lastUsed))
    .then(rows => rows.filter(conn => conn.ownerId !== userId))

  return {
    success: true,
    connections: {
      my: myConnections,
      shared: sharedConnections,
    },
  }
}

/**
 * Get single connection
 */
export async function getConnection(
  connectionId: string,
  userId: string,
  userRole: string
): Promise<GetConnectionResponseDto> {
  const connection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  if (!connection) {
    return {
      success: false,
      error: 'Connection not found',
    }
  }

  // Check access: must be owner or connection must be shared or user is admin
  if (
    connection.ownerId !== userId &&
    !connection.isShared &&
    userRole !== 'admin'
  ) {
    return {
      success: false,
      error: 'Access denied',
    }
  }

  return {
    success: true,
    connection,
  }
}

/**
 * Get connection secret (decrypted password)
 */
export async function getConnectionSecret(
  connectionId: string,
  userId: string,
  userRole: string
): Promise<GetConnectionSecretResponseDto> {
  const connection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  if (!connection) {
    return {
      success: false,
      error: 'Connection not found',
    }
  }

  // Only owner or admin can view secret
  if (connection.ownerId !== userId && userRole !== 'admin') {
    return {
      success: false,
      error: 'Access denied',
    }
  }

  const password = connection.passwordEnc
    ? await decrypt(connection.passwordEnc)
    : null

  return {
    success: true,
    password,
  }
}

/**
 * Create new connection
 */
export async function createConnection(
  data: CreateConnectionRequestDto,
  userId: string,
  userRole: string
): Promise<CreateConnectionResponseDto> {
  let config: ParsedConnection & { name: string; description?: string; isShared: boolean }

  // Parse based on input type
  if ('connectionString' in data) {
    if (!isValidConnectionString(data.connectionString)) {
      return { success: false, error: 'Invalid connection string format' }
    }
    const parsed = parseConnectionString(data.connectionString)
    config = {
      ...parsed,
      name: data.name,
      description: data.description,
      isShared: data.isShared || false,
    }
  } else {
    config = {
      name: data.name,
      description: data.description,
      host: data.host,
      port: data.port || 6379,
      password: data.password,
      username: data.username,
      database: data.database || 0,
      useTls: data.useTls || false,
      isShared: data.isShared || false,
    }
  }

  // Validate host
  if (!isValidHost(config.host)) {
    return { success: false, error: 'Invalid host format' }
  }

  // Only admins and editors can create shared connections
  if (config.isShared && userRole === 'viewer') {
    return { success: false, error: 'Viewers cannot create shared connections' }
  }

  // Encrypt password if provided
  const encryptedPassword = config.password ? await encrypt(config.password) : null

  const connectionId = nanoid()
  await db.insert(connections).values({
    id: connectionId,
    name: config.name,
    description: config.description || null,
    host: config.host,
    port: config.port,
      passwordEnc: encryptedPassword,
    username: config.username || null,
    database: config.database,
    useTls: config.useTls,
    isShared: config.isShared,
    ownerId: userId,
    lastStatus: null,
    lastError: null,
    lastUsed: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const newConnection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  return {
    success: true,
    connection: newConnection,
  }
}

/**
 * Update connection
 */
export async function updateConnection(
  connectionId: string,
  data: UpdateConnectionRequestDto,
  userId: string,
  userRole: string
): Promise<UpdateConnectionResponseDto> {
  const connection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  if (!connection) {
    return { success: false, error: 'Connection not found' }
  }

  // Check permissions: must be owner or admin
  if (connection.ownerId !== userId && userRole !== 'admin') {
    return { success: false, error: 'Access denied' }
  }

  // Only admins can update shared status
  if (data.isShared !== undefined && connection.isShared !== data.isShared && userRole !== 'admin') {
    return { success: false, error: 'Only admins can change shared status' }
  }

  const updateData: Partial<typeof connections.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (data.name) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.host) updateData.host = data.host
  if (data.port) updateData.port = data.port
  if (data.username !== undefined) updateData.username = data.username
  if (data.database !== undefined) updateData.database = data.database
  if (data.useTls !== undefined) updateData.useTls = data.useTls
  if (data.isShared !== undefined) updateData.isShared = data.isShared

  // Handle password update
  if (data.password !== undefined) {
    updateData.passwordEnc = data.password ? await encrypt(data.password) : null
  }

  await db
    .update(connections)
    .set(updateData)
    .where(eq(connections.id, connectionId))

  const updatedConnection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  return {
    success: true,
    connection: updatedConnection,
  }
}

/**
 * Delete connection
 */
export async function deleteConnection(
  connectionId: string,
  userId: string,
  userRole: string
): Promise<DeleteConnectionResponseDto> {
  const connection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  if (!connection) {
    return { success: false, error: 'Connection not found' }
  }

  // Check permissions
  if (connection.ownerId !== userId && userRole !== 'admin') {
    return { success: false, error: 'Access denied' }
  }

  // Close active connection if any
  await disconnectRedis(connectionId)

  // Delete from database
  await db.delete(connections).where(eq(connections.id, connectionId))

  return {
    success: true,
    message: 'Connection deleted successfully',
  }
}

/**
 * Connect to Redis instance
 */
export async function connect(
  connectionId: string,
  userId: string,
  userRole: string
): Promise<ConnectResponseDto> {
  const connection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  if (!connection) {
    return { success: false, error: 'Connection not found' }
  }

  // Check access
  if (
    connection.ownerId !== userId &&
    !connection.isShared &&
    userRole !== 'admin'
  ) {
    return { success: false, error: 'Access denied' }
  }

  // Decrypt password
  const password = connection.passwordEnc
    ? await decrypt(connection.passwordEnc)
    : undefined

  const config: ConnectionConfig = {
    id: connection.id,
    host: connection.host,
    port: connection.port,
    password,
    username: connection.username || undefined,
    database: connection.database,
    useTls: connection.useTls,
  }

  try {
    const redis = await getRedisConnection(config)
    await redis.ping()

    // Update last used
    await db
      .update(connections)
      .set({
        lastUsed: new Date(),
        lastStatus: 'connected',
        lastError: null,
      })
      .where(eq(connections.id, connectionId))

    return {
      success: true,
      message: 'Connected successfully',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Connection failed'

    await db
      .update(connections)
      .set({
        lastStatus: 'error',
        lastError: errorMessage,
      })
      .where(eq(connections.id, connectionId))

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Test an existing connection by ID
 */
export async function testExistingConnection(
  connectionId: string,
  userId: string,
  userRole: string
): Promise<TestConnectionResponseDto> {
  const connection = await db
    .select()
    .from(connections)
    .where(eq(connections.id, connectionId))
    .limit(1)
    .then(rows => rows[0])

  if (!connection) {
    return { success: false, error: 'Connection not found' }
  }

  if (
    connection.ownerId !== userId &&
    !connection.isShared &&
    userRole !== 'admin'
  ) {
    return { success: false, error: 'Access denied' }
  }

  const password = connection.passwordEnc
    ? await decrypt(connection.passwordEnc)
    : undefined

  const config: ConnectionConfig = {
    id: connection.id,
    host: connection.host,
    port: connection.port,
    password,
    username: connection.username || undefined,
    database: connection.database,
    useTls: connection.useTls,
  }

  const startTime = Date.now()
  const testResult = await testRedisConnection(config)
  const latencyMs = Date.now() - startTime

  if (testResult.success) {
    await db
      .update(connections)
      .set({
        lastStatus: 'connected',
        lastError: null,
        lastUsed: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(connections.id, connectionId))

    return {
      success: true,
      latencyMs,
      serverInfo: testResult.info,
    }
  }

  await db
    .update(connections)
    .set({
      lastStatus: 'error',
      lastError: testResult.error || 'Connection failed',
      updatedAt: new Date(),
    })
    .where(eq(connections.id, connectionId))

  return {
    success: false,
    error: testResult.error,
  }
}

/**
 * Disconnect from Redis instance
 */
export async function disconnect(connectionId: string): Promise<DisconnectResponseDto> {
  await disconnectRedis(connectionId)

  return {
    success: true,
    message: 'Disconnected successfully',
  }
}
