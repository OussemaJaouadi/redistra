/**
 * Redis Controllers
 * Pure functions that handle Redis operations business logic
 */

import Redis from 'ioredis'
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
  SelectDatabaseRequestDto,
  SelectDatabaseResponseDto,
  FlushDatabaseResponseDto,
  FlushAllResponseDto,
  RedisKey,
  RedisDataType,
  HashValue,
  ListValue,
  SetValue,
  ZSetValue,
  StreamValue,
  DatabaseInfo
} from '@/types'
import type { RedisInfoResponseDto } from '@/types'

async function ensureDb(redis: Redis, db: number) {
  await redis.select(db)
}

/**
 * List keys using SCAN for non-blocking pagination
 */
export async function listKeys(
  redis: Redis,
  query: ListKeysQueryDto
): Promise<ListKeysResponseDto> {
  try {
    const {
      pattern = '*',
      type,
      cursor = '0',
      count = 100,
      page = 1,
      limit = 25,
      db = 0
    } = query

    await ensureDb(redis, db)

    // Use SCAN for non-blocking key iteration
    const scanResult = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      count
    )

    const [nextCursor, keys] = scanResult

    // Get key information for each key
    const keyInfos: RedisKey[] = []
    
    // Process in batches to avoid pipeline overload
    const batchSize = 50
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const pipeline = redis.pipeline()
      
      batch.forEach(key => {
        pipeline.type(key)
        pipeline.ttl(key)
        pipeline.memory?.('USAGE', key) // Use memory usage if available
      })
      
      const results = await pipeline.exec()

      if (!results) {
        continue
      }

      for (let index = 0; index < batch.length; index += 1) {
        const typeResult = results[index * 3]
        const ttlResult = results[index * 3 + 1]
        const memoryResult = results[index * 3 + 2]

        if (!typeResult || typeResult[0] !== null) {
          continue
        }

        const key = batch[index]
        const typeValue = typeResult[1] as string

        if (typeValue === 'none') {
          continue
        }

        // Skip if type filter is specified and doesn't match
        if (type && !type.includes(typeValue as RedisDataType)) {
          continue
        }

        const ttlValue = ttlResult?.[1] as number | undefined
        const memoryValue = memoryResult?.[1] as number | undefined

        const keyInfo: RedisKey = {
          key,
          type: typeValue as RedisDataType,
          ttl: ttlValue === -1 ? undefined : ttlValue,
          size: memoryValue || undefined
        }

        // Get length for collection types
        if (['list', 'set', 'zset', 'hash', 'stream'].includes(typeValue)) {
          // We'll get length in a separate batch to avoid pipeline complexity
          keyInfo.length = undefined // Will be populated if needed
        }

        keyInfos.push(keyInfo)
      }
    }

    // Get lengths for collection types if needed
    for (const keyInfo of keyInfos) {
      if (keyInfo.type === 'list') {
        keyInfo.length = await redis.llen(keyInfo.key)
      } else if (keyInfo.type === 'set') {
        keyInfo.length = await redis.scard(keyInfo.key)
      } else if (keyInfo.type === 'zset') {
        keyInfo.length = await redis.zcard(keyInfo.key)
      } else if (keyInfo.type === 'hash') {
        keyInfo.length = await redis.hlen(keyInfo.key)
      } else if (keyInfo.type === 'stream') {
        keyInfo.length = await redis.xlen(keyInfo.key)
      }
    }

    // Apply pagination for frontend
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedKeys = keyInfos.slice(startIndex, endIndex)

    return {
      success: true,
      keys: paginatedKeys,
      total: keyInfos.length,
      cursor: nextCursor === '0' ? undefined : nextCursor,
      hasMore: nextCursor !== '0'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list keys'
    }
  }
}

/**
 * Get key details and value
 */
export async function getKey(
  redis: Redis,
  key: string,
  db: number = 0
): Promise<GetKeyResponseDto> {
  try {
    await ensureDb(redis, db)

    // Check if key exists
    const exists = await redis.exists(key)
    if (!exists) {
      return {
        success: false,
        error: 'Key does not exist'
      }
    }

    // Get key metadata
    const type = await redis.type(key) as RedisDataType
    const ttl = await redis.ttl(key)
    const memory = await redis.memory?.('USAGE', key)

    const keyInfo: RedisKey = {
      key,
      type,
      ttl: ttl === -1 ? undefined : ttl,
      size: memory || undefined
    }

    // Get value based on type
    let value: unknown = undefined

    switch (type) {
      case 'string':
        value = await redis.get(key)
        break

      case 'hash':
        const hashData = await redis.hgetall(key)
        value = hashData as HashValue
        keyInfo.length = Object.keys(hashData).length
        break

      case 'list':
        const listLength = await redis.llen(key)
        const listData = await redis.lrange(key, 0, -1)
        value = {
          items: listData,
          total: listLength
        } as ListValue
        keyInfo.length = listLength
        break

      case 'set':
        const setData = await redis.smembers(key)
        value = {
          members: setData,
          total: setData.length
        } as SetValue
        keyInfo.length = setData.length
        break

      case 'zset':
        const zsetData = await redis.zrange(key, 0, -1, 'WITHSCORES')
        const members: Array<{ member: string; score: number }> = []
        for (let i = 0; i < zsetData.length; i += 2) {
          members.push({
            member: zsetData[i],
            score: parseFloat(zsetData[i + 1])
          })
        }
        value = {
          members,
          total: members.length
        } as ZSetValue
        keyInfo.length = members.length
        break

      case 'stream':
        const streamData = await redis.xrange(key, '-', '+')
        const entries = streamData.map(([id, fields]) => ({
          id,
          fields: fields.reduce((obj, [k, v], i) => {
            if (i % 2 === 0) obj[k] = v
            return obj
          }, {} as Record<string, string>)
        }))
        value = {
          entries,
          total: entries.length,
          firstId: entries[0]?.id,
          lastId: entries[entries.length - 1]?.id
        } as StreamValue
        keyInfo.length = entries.length
        break

      default:
        value = null
        break
    }

    return {
      success: true,
      key: keyInfo,
      value
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get key'
    }
  }
}

/**
 * Create a new key
 */
export async function createKey(
  redis: Redis,
  data: CreateKeyRequestDto
): Promise<CreateKeyResponseDto> {
  try {
    const { key, type, value, ttl, db = 0 } = data

    await ensureDb(redis, db)

    // Check if key already exists
    const exists = await redis.exists(key)
    if (exists) {
      return {
        success: false,
        error: 'Key already exists'
      }
    }

    // Create key based on type
    switch (type) {
      case 'string':
        await redis.set(key, String(value))
        break

      case 'hash':
        if (typeof value === 'object' && value !== null) {
          const hashData = value as Record<string, string>
          if (Object.keys(hashData).length === 0) {
            return {
              success: false,
              error: 'Hash value must include at least one field'
            }
          }
          await redis.hset(key, hashData)
        } else {
          return {
            success: false,
            error: 'Hash value must be an object'
          }
        }
        break

      case 'list':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return {
              success: false,
              error: 'List value must include at least one item'
            }
          }
          await redis.lpush(key, ...value.map(String))
        } else {
          return {
            success: false,
            error: 'List value must be an array'
          }
        }
        break

      case 'set':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return {
              success: false,
              error: 'Set value must include at least one item'
            }
          }
          await redis.sadd(key, ...value.map(String))
        } else {
          return {
            success: false,
            error: 'Set value must be an array'
          }
        }
        break

      case 'zset':
        if (Array.isArray(value)) {
          const zsetData: string[] = []
          value.forEach(item => {
            if (typeof item === 'object' && item !== null && 'member' in item && 'score' in item) {
              zsetData.push(item.score, item.member)
            }
          })
          if (zsetData.length === 0) {
            return {
              success: false,
              error: 'Sorted set value must include at least one member'
            }
          }
          await redis.zadd(key, ...zsetData)
        } else {
          return {
            success: false,
            error: 'Sorted set value must be an array of {member, score} objects'
          }
        }
        break

      case 'stream':
        if (typeof value === 'object' && value !== null && 'fields' in value) {
          const streamValue = value as { fields: Record<string, string> }
          // Convert fields object to array for xadd
          const fieldPairs: string[] = []
          Object.entries(streamValue.fields).forEach(([k, v]) => {
            fieldPairs.push(k, v)
          })
          await redis.xadd(key, '*', ...fieldPairs)
        } else {
          return {
            success: false,
            error: 'Stream value must have fields property'
          }
        }
        break

      default:
        return {
          success: false,
          error: `Unsupported Redis type: ${type}`
        }
    }

    // Set TTL if specified
    if (ttl && ttl > 0) {
      await redis.expire(key, ttl)
    }

    return {
      success: true,
      message: `Key "${key}" created successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create key'
    }
  }
}

/**
 * Update an existing key
 */
export async function updateKey(
  redis: Redis,
  key: string,
  data: UpdateKeyRequestDto
): Promise<UpdateKeyResponseDto> {
  try {
    const { value, db = 0 } = data

    await ensureDb(redis, db)

    // Check if key exists
    const exists = await redis.exists(key)
    if (!exists) {
      return {
        success: false,
        error: 'Key does not exist'
      }
    }

    // Get key type
    const type = await redis.type(key) as RedisDataType

    // Update based on type
    switch (type) {
      case 'string':
        await redis.set(key, String(value))
        break

      case 'hash':
        if (typeof value === 'object' && value !== null) {
          // Delete existing hash and set new values
          await redis.del(key)
          const hashData = value as Record<string, string>
          await redis.hset(key, hashData)
        } else {
          return {
            success: false,
            error: 'Hash value must be an object'
          }
        }
        break

      case 'list':
        if (Array.isArray(value)) {
          await redis.del(key)
          if (value.length > 0) {
            await redis.lpush(key, ...value.map(String))
          }
        } else {
          return {
            success: false,
            error: 'List value must be an array'
          }
        }
        break

      case 'set':
        if (Array.isArray(value)) {
          await redis.del(key)
          if (value.length > 0) {
            await redis.sadd(key, ...value.map(String))
          }
        } else {
          return {
            success: false,
            error: 'Set value must be an array'
          }
        }
        break

      case 'zset':
        if (Array.isArray(value)) {
          await redis.del(key)
          const zsetData: string[] = []
          value.forEach(item => {
            if (typeof item === 'object' && item !== null && 'member' in item && 'score' in item) {
              zsetData.push(item.score, item.member)
            }
          })
          if (zsetData.length > 0) {
            await redis.zadd(key, ...zsetData)
          }
        } else {
          return {
            success: false,
            error: 'Sorted set value must be an array of {member, score} objects'
          }
        }
        break

      default:
        return {
          success: false,
          error: `Updating Redis type "${type}" is not supported`
        }
    }

    return {
      success: true,
      message: `Key "${key}" updated successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update key'
    }
  }
}

/**
 * Delete a key
 */
export async function deleteKey(
  redis: Redis,
  key: string,
  db: number = 0
): Promise<DeleteKeyResponseDto> {
  try {
    await ensureDb(redis, db)

    const result = await redis.del(key)

    if (result === 0) {
      return {
        success: false,
        error: 'Key does not exist'
      }
    }

    return {
      success: true,
      message: `Key "${key}" deleted successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete key'
    }
  }
}

/**
 * Set TTL on a key
 */
export async function setTtl(
  redis: Redis,
  key: string,
  data: SetTtlRequestDto
): Promise<SetTtlResponseDto> {
  try {
    const { ttl, db = 0 } = data

    await ensureDb(redis, db)

    // Check if key exists
    const exists = await redis.exists(key)
    if (!exists) {
      return {
        success: false,
        error: 'Key does not exist'
      }
    }

    let result: number
    if (ttl === undefined || ttl === -1) {
      // Remove TTL
      result = await redis.persist(key)
    } else {
      // Set TTL
      result = await redis.expire(key, ttl)
    }

    if (result === 0) {
      return {
        success: false,
        error: 'Failed to set TTL'
      }
    }

    const newTtl = await redis.ttl(key)

    return {
      success: true,
      ttl: newTtl === -1 ? undefined : newTtl,
      message: `TTL updated successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set TTL'
    }
  }
}

/**
 * Rename a key
 */
export async function renameKey(
  redis: Redis,
  key: string,
  data: RenameKeyRequestDto
): Promise<RenameKeyResponseDto> {
  try {
    const { newKey, db = 0, nx = false } = data

    await ensureDb(redis, db)

    // Check if source key exists
    const exists = await redis.exists(key)
    if (!exists) {
      return {
        success: false,
        error: 'Source key does not exist'
      }
    }

    let result: number | string

    if (nx) {
      // Use RENAMENX - don't overwrite if new key exists
      result = await redis.renamenx(key, newKey)
      if (result === 0) {
        return {
          success: false,
          error: 'Target key already exists'
        }
      }
    } else {
      // Use RENAME - overwrite if exists
      result = await redis.rename(key, newKey)
    }

    return {
      success: true,
      message: `Key renamed to "${newKey}" successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rename key'
    }
  }
}

/**
 * Bulk delete keys
 */
export async function bulkDelete(
  redis: Redis,
  data: BulkDeleteRequestDto
): Promise<BulkDeleteResponseDto> {
  try {
    const { keys, db = 0 } = data

    await ensureDb(redis, db)

    // Delete keys in batches to avoid blocking
    const batchSize = 100
    let totalDeleted = 0
    const failed: string[] = []

    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      
      try {
        const result = await redis.del(...batch)
        totalDeleted += result
      } catch {
        failed.push(...batch)
      }
    }

    return {
      success: failed.length === 0,
      deleted: totalDeleted,
      failed: failed.length > 0 ? failed : undefined,
      message: `Deleted ${totalDeleted} keys successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk delete keys'
    }
  }
}

/**
 * List all databases with statistics
 */
export async function listDatabases(
  redis: Redis
): Promise<ListDatabasesResponseDto> {
  try {
    const databases: DatabaseInfo[] = []
    let totalKeys = 0
    let totalMemory = 0

    // Get info for all databases (0-15)
    for (let db = 0; db <= 15; db++) {
      // Switch to database
      await redis.select(db)
      
      // Get database size
      const keyCount = await redis.dbsize()
      
      if (keyCount > 0) {
        // Get memory usage for this database
        let memoryUsage = 0
        let ttlSum = 0
        let ttlCount = 0
        let expires = 0
        let persistent = 0
        
        // Get key distribution by type
        const keyDistribution: Record<RedisDataType, number> = {
          string: 0,
          hash: 0,
          list: 0,
          set: 0,
          zset: 0,
          stream: 0
        }
        
        // Sample keys for statistics (to avoid scanning all keys in large databases)
        const sampleSize = Math.min(keyCount, 1000)
        const cursor = '0'
        const scanResult = await redis.scan(cursor, 'COUNT', sampleSize)
        const [, sampleKeys] = scanResult
        
        if (sampleKeys.length > 0) {
          // Get type and TTL for sample keys
          const pipeline = redis.pipeline()
          sampleKeys.forEach(key => {
            pipeline.type(key)
            pipeline.ttl(key)
            pipeline.memory?.('USAGE', key)
          })
          
          const results = await pipeline.exec()
          
          results?.forEach((result, index) => {
            if (result && result[0] === null) {
              const type = result[1] as RedisDataType
              const ttl = results[index + 1]?.[1] as number
              const memory = results[index + 2]?.[1] as number
              
              keyDistribution[type]++
              memoryUsage += memory || 0
              
              if (ttl > 0) {
                ttlSum += ttl
                ttlCount++
                expires++
              } else {
                persistent++
              }
            }
          })
          
          // Extrapolate to full database
          const multiplier = keyCount / sampleKeys.length
          Object.keys(keyDistribution).forEach(type => {
            const keyType = type as RedisDataType
            keyDistribution[keyType] = Math.round(keyDistribution[keyType] * multiplier)
          })
          memoryUsage = Math.round(memoryUsage * multiplier)
        }
        
        const avgTtl = ttlCount > 0 ? Math.round(ttlSum / ttlCount) : undefined
        
        databases.push({
          number: db,
          keyCount,
          memoryUsage,
          avgTtl,
          expires,
          persistent,
          keyDistribution
        })
        
        totalKeys += keyCount
        totalMemory += memoryUsage
      } else {
        databases.push({
          number: db,
          keyCount: 0,
          keyDistribution: {
            string: 0,
            hash: 0,
            list: 0,
            set: 0,
            zset: 0,
            stream: 0
          }
        })
      }
    }

    return {
      success: true,
      databases,
      totalKeys,
      totalMemory
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list databases'
    }
  }
}

/**
 * Get Redis server info (overview stats)
 */
export async function getRedisInfo(
  redis: Redis
): Promise<RedisInfoResponseDto> {
  try {
    const [serverInfoRaw, memoryInfoRaw, clientsInfoRaw, statsInfoRaw, replicationInfoRaw] = await Promise.all([
      redis.info('server'),
      redis.info('memory'),
      redis.info('clients'),
      redis.info('stats'),
      redis.info('replication'),
    ])

    const server = parseRedisInfo(serverInfoRaw)
    const memory = parseRedisInfo(memoryInfoRaw)
    const clients = parseRedisInfo(clientsInfoRaw)
    const stats = parseRedisInfo(statsInfoRaw)
    const replication = parseRedisInfo(replicationInfoRaw)
    const ping = await redis.ping()

    return {
      success: true,
      info: {
        server: {
          redis_version: server.redis_version,
          os: server.os,
          uptime_in_seconds: server.uptime_in_seconds,
        },
        memory: {
          used_memory: memory.used_memory,
          used_memory_human: memory.used_memory_human,
          used_memory_peak: memory.used_memory_peak,
          used_memory_peak_human: memory.used_memory_peak_human,
          total_system_memory: memory.total_system_memory,
          total_system_memory_human: memory.total_system_memory_human,
          mem_fragmentation_ratio: memory.mem_fragmentation_ratio,
        },
        clients: {
          connected_clients: clients.connected_clients,
          blocked_clients: clients.blocked_clients,
        },
        stats: {
          total_connections_received: stats.total_connections_received,
          total_commands_processed: stats.total_commands_processed,
          instantaneous_ops_per_sec: stats.instantaneous_ops_per_sec,
        },
        replication: {
          role: replication.role,
          connected_slaves: replication.connected_slaves,
        },
        health: {
          ping,
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get Redis info',
    }
  }
}

function parseRedisInfo(info: string): Record<string, string> {
  const parsed: Record<string, string> = {}

  info.split('\n').forEach((line) => {
    if (!line || line.startsWith('#')) {
      return
    }

    const index = line.indexOf(':')
    if (index === -1) {
      return
    }

    const key = line.slice(0, index)
    const value = line.slice(index + 1).trim()
    if (key) {
      parsed[key] = value
    }
  })

  return parsed
}

/**
 * Get detailed information about a specific database
 */
export async function getDatabaseInfo(
  redis: Redis,
  database: number
): Promise<GetDatabaseInfoResponseDto> {
  try {
    // Switch to specified database
    await redis.select(database)
    
    const keyCount = await redis.dbsize()
    
    if (keyCount === 0) {
      return {
        success: true,
        database: {
          number: database,
          keyCount: 0,
          keyDistribution: {
            string: 0,
            hash: 0,
            list: 0,
            set: 0,
            zset: 0,
            stream: 0
          }
        }
      }
    }
    
    // Get detailed statistics
    let memoryUsage = 0
    let ttlSum = 0
    let ttlCount = 0
    let expires = 0
    let persistent = 0
    
    // Get key distribution by type
    const keyDistribution: Record<RedisDataType, number> = {
      string: 0,
      hash: 0,
      list: 0,
      set: 0,
      zset: 0,
      stream: 0
    }
    
    // Sample keys for statistics
    const sampleSize = Math.min(keyCount, 1000)
    const cursor = '0'
    const scanResult = await redis.scan(cursor, 'COUNT', sampleSize)
    const [, sampleKeys] = scanResult
    
    if (sampleKeys.length > 0) {
      const pipeline = redis.pipeline()
      sampleKeys.forEach(key => {
        pipeline.type(key)
        pipeline.ttl(key)
        pipeline.memory?.('USAGE', key)
      })
      
      const results = await pipeline.exec()
      
      results?.forEach((result, index) => {
        if (result && result[0] === null) {
          const type = result[1] as RedisDataType
          const ttl = results[index + 1]?.[1] as number
          const memory = results[index + 2]?.[1] as number
          
          keyDistribution[type]++
          memoryUsage += memory || 0
          
          if (ttl > 0) {
            ttlSum += ttl
            ttlCount++
            expires++
          } else {
            persistent++
          }
        }
      })
      
      // Extrapolate to full database
      const multiplier = keyCount / sampleKeys.length
      Object.keys(keyDistribution).forEach(type => {
        const keyType = type as RedisDataType
        keyDistribution[keyType] = Math.round(keyDistribution[keyType] * multiplier)
      })
      memoryUsage = Math.round(memoryUsage * multiplier)
    }
    
    const avgTtl = ttlCount > 0 ? Math.round(ttlSum / ttlCount) : undefined
    
    return {
      success: true,
      database: {
        number: database,
        keyCount,
        memoryUsage,
        avgTtl,
        expires,
        persistent,
        keyDistribution
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get database info'
    }
  }
}

/**
 * Select a database (switch active database)
 */
export async function selectDatabase(
  redis: Redis,
  data: SelectDatabaseRequestDto
): Promise<SelectDatabaseResponseDto> {
  try {
    const { database } = data
    
    // Validate database number
    if (database < 0 || database > 15) {
      return {
        success: false,
        error: 'Database number must be between 0 and 15'
      }
    }
    
    // Switch to database
    await redis.select(database)
    
    return {
      success: true,
      message: `Switched to database ${database}`,
      currentDatabase: database
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to select database'
    }
  }
}

/**
 * Flush a specific database (admin only)
 */
export async function flushDatabase(
  redis: Redis,
  database: number,
  confirmation: string
): Promise<FlushDatabaseResponseDto> {
  try {
    // Validate confirmation
    if (confirmation !== database.toString()) {
      return {
        success: false,
        error: 'Confirmation must match the database number'
      }
    }
    
    // Get key count before flush for audit
    await redis.select(database)
    const keyCount = await redis.dbsize()
    
    // Flush the database
    const result = await redis.flushdb()
    
    if (result !== 'OK') {
      return {
        success: false,
        error: 'Failed to flush database'
      }
    }
    
    return {
      success: true,
      message: `Database ${database} flushed successfully`,
      keysDeleted: keyCount
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to flush database'
    }
  }
}

/**
 * Flush all databases (admin only)
 */
export async function flushAll(
  redis: Redis
): Promise<FlushAllResponseDto> {
  try {
    let totalKeysDeleted = 0
    const databasesAffected: number[] = []
    
    // Get key counts for all databases
    for (let db = 0; db <= 15; db++) {
      await redis.select(db)
      const keyCount = await redis.dbsize()
      if (keyCount > 0) {
        databasesAffected.push(db)
        totalKeysDeleted += keyCount
      }
    }
    
    // Flush all databases
    const result = await redis.flushall()
    
    if (result !== 'OK') {
      return {
        success: false,
        error: 'Failed to flush all databases'
      }
    }
    
    return {
      success: true,
      message: 'All databases flushed successfully',
      totalKeysDeleted,
      databasesAffected: databasesAffected.length
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to flush all databases'
    }
  }
}
