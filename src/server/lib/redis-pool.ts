/**
 * Redis Connection Pool Manager
 * Manages Redis connections, pooling, and lifecycle
 */

/// <reference types="@types/bun" />
import Redis from 'ioredis'
import type { ConnectionConfig } from '@/types'

// In-memory connection storage
const connections = new Map<string, Redis>()
const userConnections = new Map<string, Set<string>>() // userId -> connectionIds

function connectionKey(connectionId: string, database: number) {
  return `${connectionId}:${database}`
}

/**
 * Get or create Redis connection
 */
export async function getRedisConnection(
  config: ConnectionConfig,
  databaseOverride?: number
): Promise<Redis> {
  const targetDb = databaseOverride ?? config.database
  const key = connectionKey(config.id, targetDb)
  // Check if connection already exists
  if (connections.has(key)) {
    const existing = connections.get(key)!
    
    // Check if connection is still alive
    if (existing.status === 'ready') {
      return existing
    }
    
    // Remove dead connection
    connections.delete(key)
  }

  // Create new connection
  const redis = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    username: config.username,
    db: targetDb,
    tls: config.useTls ? {} : undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })

  connections.set(key, redis)
  
  // Track user-connection relationship
  const userId = config.id // Using connection ID as proxy for owner
  if (!userConnections.has(userId)) {
    userConnections.set(userId, new Set())
  }
  userConnections.get(userId)!.add(key)

  return redis
}

/**
 * Disconnect Redis connection
 */
export async function disconnectRedis(connectionId: string): Promise<void> {
  const prefix = `${connectionId}:`
  for (const [key, conn] of connections.entries()) {
    if (!key.startsWith(prefix)) continue
    await conn.quit().catch(() => conn.disconnect())
    connections.delete(key)
  }

  // Remove from user tracking
  for (const [userId, connIds] of userConnections.entries()) {
    for (const key of Array.from(connIds)) {
      if (key.startsWith(prefix)) {
        connIds.delete(key)
      }
    }
    if (connIds.size === 0) {
      userConnections.delete(userId)
    }
  }
}

/**
 * Disconnect all connections for a user
 */
export async function disconnectAllForUser(userId: string): Promise<void> {
  const connIds = userConnections.get(userId)
  if (connIds) {
    for (const connId of connIds) {
      const [connectionId] = connId.split(':')
      await disconnectRedis(connectionId)
    }
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(
  config: ConnectionConfig
): Promise<{ success: boolean; error?: string; info?: string }> {
  const redis = new Redis({
    host: config.host,
    port: config.port,
    password: config.password,
    username: config.username,
    db: config.database,
    tls: config.useTls ? {} : undefined,
    lazyConnect: true,
  })

  try {
    await redis.connect()
    const info = await redis.info('server')
    return { success: true, info }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection failed' 
    }
  } finally {
    await redis.quit().catch(() => redis.disconnect())
  }
}

/**
 * Get connection status
 */
export function getRedisStatus(connectionId: string): 'connected' | 'error' | 'unknown' {
  const prefix = `${connectionId}:`
  let hasConnection = false
  let hasReady = false
  let hasError = false

  for (const [key, conn] of connections.entries()) {
    if (!key.startsWith(prefix)) continue
    hasConnection = true
    if (conn.status === 'ready') hasReady = true
    if (conn.status === 'end') hasError = true
  }

  if (!hasConnection) return 'unknown'
  if (hasReady) return 'connected'
  if (hasError) return 'error'
  return 'unknown'
}
