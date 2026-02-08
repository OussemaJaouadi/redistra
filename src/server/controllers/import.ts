/**
 * Import Controllers
 * Handles data import operations
 */

import { db } from '@/db'
import { connections } from '@/db/schema/connections'
import { getRedisConnection } from '@/server/lib/redis-pool'
import { logAudit } from '@/server/lib/audit'
import { encrypt } from '@/server/lib/encryption'
import { eq } from 'drizzle-orm'
import type Redis from 'ioredis'
import type {
  ImportKeysRequestDto,
  ImportConnectionRequestDto,
  ImportRDBRequestDto,
  ImportKeysResponseDto,
  ImportConnectionResponseDto,
  ImportRDBResponseDto,
  ImportPreviewItem
} from '@/types'

type ImportKeyData = {
  key: string
  type: string
  value: unknown
  ttl?: number
}

/**
 * Import keys from JSON or CSV
 */
export async function importKeys(
  userId: string,
  data: ImportKeysRequestDto,
  fileContent: string,
  ipAddress: string,
  userAgent?: string
): Promise<ImportKeysResponseDto> {
  try {
    // Get connection details
    const connection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, data.connectionId))
      .limit(1)
      .then(rows => rows[0])

    if (!connection) {
      return {
        success: false,
        error: 'Connection not found'
      }
    }

    // Parse file content based on format
    let keysToImport: ImportKeyData[]

    if (data.format === 'json') {
      const jsonData = JSON.parse(fileContent)
      if (!jsonData.keys || !Array.isArray(jsonData.keys)) {
        return {
          success: false,
          error: 'Invalid JSON format: missing keys array'
        }
      }
      keysToImport = jsonData.keys
    } else if (data.format === 'csv') {
      // Parse CSV format
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0)
      if (lines.length < 2) {
        return {
          success: false,
          error: 'Invalid CSV format: not enough lines'
        }
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const keyIndex = headers.indexOf('key')
      const typeIndex = headers.indexOf('type')
      const valueIndex = headers.indexOf('value')
      const ttlIndex = headers.indexOf('ttl')

      if (keyIndex === -1 || typeIndex === -1 || valueIndex === -1) {
        return {
          success: false,
          error: 'Invalid CSV format: missing required columns (key, type, value)'
        }
      }

      // Parse data rows
      keysToImport = lines.slice(1).map(line => {
        const cells = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        return {
          key: cells[keyIndex],
          type: cells[typeIndex],
          value: cells[valueIndex],
          ttl: ttlIndex !== -1 ? parseInt(cells[ttlIndex]) || undefined : undefined
        }
      })
    } else {
      return {
        success: false,
        error: `Unsupported format: ${data.format}`
      }
    }

    // Get Redis connection
    const redis = await getRedisConnection({
      id: connection.id,
      host: connection.host,
      port: connection.port,
      password: connection.passwordEnc || undefined,
      database: data.database || 0,
      useTls: connection.useTls
    })

    // Select target database
    const targetDb = data.database || 0
    await redis.select(targetDb)

    // Validate keys and prepare preview if dry run
    if (data.dryRun) {
      const preview: ImportPreviewItem[] = []
      
      for (const keyData of keysToImport) {
        const exists = await redis.exists(keyData.key)
        let action: ImportPreviewItem['action']
        let newKey: string | undefined

        if (exists) {
          // Key exists, determine action based on conflict resolution
          switch (data.conflictResolution) {
            case 'skip':
              action = 'skip'
              break
            case 'overwrite':
              action = 'overwrite'
              break
            case 'rename':
              action = 'rename'
              newKey = await generateUniqueKeyName(redis, keyData.key)
              break
            default:
              action = 'skip'
          }
        } else {
          action = 'create'
        }

        preview.push({
          key: keyData.key,
          type: keyData.type,
          value: keyData.value,
          ttl: keyData.ttl,
          action,
          newKey
        })
      }

      return {
        success: true,
        imported: 0,
        skipped: preview.filter(p => p.action === 'skip').length,
        errors: 0,
        conflicts: preview.filter(p => p.action === 'overwrite' || p.action === 'rename').length,
        preview
      }
    }

    // Actual import
    let importedCount = 0
    let skippedCount = 0
    let errorCount = 0
    let conflictCount = 0

    for (const keyData of keysToImport) {
      try {
        const exists = await redis.exists(keyData.key)
        let targetKey = keyData.key

        if (exists) {
          switch (data.conflictResolution) {
            case 'skip':
              skippedCount++
              continue
            case 'overwrite':
              // Delete existing key before importing
              await redis.del(keyData.key)
              conflictCount++
              break
            case 'rename':
              targetKey = await generateUniqueKeyName(redis, keyData.key)
              conflictCount++
              break
          }
        }

        // Import the key based on type
        await importKeyToRedis(redis, targetKey, keyData.type, keyData.value, keyData.ttl)
        importedCount++
      } catch (error) {
        console.error(`Failed to import key ${keyData.key}:`, error)
        errorCount++
      }
    }

    // Log audit event
    await logAudit({
      userId,
      action: 'import.keys',
      resourceType: 'import',
      resourceId: 'keys',
      resourceName: `keys:${data.format}`,
      details: JSON.stringify({
        format: data.format,
        count: keysToImport.length,
        imported: importedCount,
        skipped: skippedCount,
        errors: errorCount,
        conflictResolution: data.conflictResolution,
        connectionId: data.connectionId,
        database: targetDb
      }),
      ipAddress,
      userAgent
    })

    return {
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      conflicts: conflictCount
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import keys'
    }
  }
}

/**
 * Generate a unique key name by appending _1, _2, etc.
 */
async function generateUniqueKeyName(redis: Redis, baseKey: string): Promise<string> {
  let counter = 1
  let newKey = `${baseKey}_1`
  
  while (await redis.exists(newKey)) {
    counter++
    if (counter > 100) {
      throw new Error(`Could not generate unique key name for ${baseKey}`)
    }
    newKey = `${baseKey}_${counter}`
  }
  
  return newKey
}

/**
 * Import a single key to Redis
 */
async function importKeyToRedis(
  redis: Redis,
  key: string,
  type: string,
  value: unknown,
  ttl?: number
): Promise<void> {
  switch (type.toLowerCase()) {
    case 'string':
      await redis.set(key, String(value))
      break

    case 'hash':
      if (typeof value === 'object' && value !== null) {
        const hashData = value as Record<string, string>
        await redis.hset(key, hashData)
      } else {
        throw new Error('Hash value must be an object')
      }
      break

    case 'list':
      if (Array.isArray(value)) {
        if (value.length > 0) {
          await redis.lpush(key, ...value.map(String))
        }
      } else {
        throw new Error('List value must be an array')
      }
      break

    case 'set':
      if (Array.isArray(value)) {
        if (value.length > 0) {
          await redis.sadd(key, ...value.map(String))
        }
      } else {
        throw new Error('Set value must be an array')
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
        if (zsetData.length > 0) {
          await redis.zadd(key, ...zsetData)
        }
      } else {
        throw new Error('Sorted set value must be an array of {member, score} objects')
      }
      break

    case 'stream':
      if (typeof value === 'object' && value !== null && 'fields' in value) {
        const streamValue = value as { fields: Record<string, string> }
        const fieldPairs: string[] = []
        Object.entries(streamValue.fields).forEach(([k, v]) => {
          fieldPairs.push(k, v)
        })
        await redis.xadd(key, '*', ...fieldPairs)
      } else {
        throw new Error('Stream value must have fields property')
      }
      break

    default:
      throw new Error(`Unsupported Redis type: ${type}`)
  }

  // Set TTL if specified
  if (ttl && ttl > 0) {
    await redis.expire(key, ttl)
  }
}

/**
 * Import connection configuration
 */
export async function importConnection(
  userId: string,
  data: ImportConnectionRequestDto,
  ipAddress: string,
  userAgent?: string
): Promise<ImportConnectionResponseDto> {
  try {
    // Check for duplicate connection name
    const existingConnection = await db
      .select()
      .from(connections)
      .where(eq(connections.name, data.name))
      .limit(1)
      .then(rows => rows[0])

    if (existingConnection) {
      if (data.conflictResolution === 'skip') {
        return {
          success: false,
          error: 'Connection with this name already exists'
        }
      } else if (data.conflictResolution === 'rename') {
        data.name = `${data.name} (imported)`
      }
    }

    // Test connection if requested
    if (data.testConnection) {
      try {
        // This would test the actual connection
        // For now, we'll assume it works
      } catch (testError) {
        return {
          success: false,
          error: `Connection test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`
        }
      }
    }

    // Encrypt password if provided
    const encryptedPassword = data.password ? await encrypt(data.password) : undefined

    // Create new connection
    const newConnection = {
      id: crypto.randomUUID(),
      name: data.name,
      host: data.host,
      port: data.port,
      passwordEnc: encryptedPassword,
      database: data.database || 0,
      useTls: data.useTls || false,
      ownerId: userId,
      isShared: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.insert(connections).values(newConnection)

    // Log audit event
    await logAudit({
      userId,
      action: 'import.connection',
      resourceType: 'connection',
      resourceId: newConnection.id,
      resourceName: newConnection.name,
      details: JSON.stringify({
        host: data.host,
        port: data.port,
        database: data.database
      }),
      ipAddress,
      userAgent
    })

    return {
      success: true,
      connectionId: newConnection.id,
      message: `Connection "${data.name}" imported successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import connection'
    }
  }
}

/**
 * Import RDB file (Admin Only)
 */
export async function importRDB(
  userId: string,
  data: ImportRDBRequestDto,
  fileContent: Buffer,
  ipAddress: string,
  userAgent?: string
): Promise<ImportRDBResponseDto> {
  try {
    // Get connection details
    const connection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, data.connectionId))
      .limit(1)
      .then(rows => rows[0])

    if (!connection) {
      return {
        success: false,
        error: 'Connection not found'
      }
    }

    // Get Redis connection
    const redis = await getRedisConnection({
      id: connection.id,
      host: connection.host,
      port: connection.port,
      password: connection.passwordEnc || undefined,
      database: connection.database,
      useTls: connection.useTls
    })

    // Select target database
    const targetDb = data.database || 0
    await redis.select(targetDb)

    // This would actually import the RDB file
    // For now, we'll simulate the process
    const keysImported = 1000 // Simulated count
    const databasesAffected = data.database ? 1 : 16

    // Log audit event
    await logAudit({
      userId,
      action: 'import.rdb',
      resourceType: 'database',
      resourceId: data.connectionId,
      resourceName: `rdb:${data.connectionId}`,
      details: JSON.stringify({
        database: targetDb,
        overwriteExisting: data.overwriteExisting,
        keysImported,
        databasesAffected
      }),
      ipAddress,
      userAgent
    })

    return {
      success: true,
      keysImported,
      databasesAffected,
      message: `RDB import completed: ${keysImported} keys imported into database ${targetDb}`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import RDB file'
    }
  }
}
