/**
 * Redis Operations DTOs
 */


/**
 * Redis data types
 */
export type RedisDataType = 'string' | 'hash' | 'list' | 'set' | 'zset' | 'stream'

/**
 * Key information
 */
export interface RedisKey {
  key: string
  type: RedisDataType
  ttl?: number // -1 for no expiry, -2 for non-existent
  size?: number // memory usage in bytes
  length?: number // number of elements for collections
}

/**
 * Database information
 */
export interface DatabaseInfo {
  number: number // Database number (0-15)
  keyCount: number // Number of keys in this database
  memoryUsage?: number // Memory used by this database
  avgTtl?: number // Average TTL for keys with expiry
  expires?: number // Number of keys with TTL set
  persistent?: number // Number of keys without TTL
  keyDistribution?: {
    [type in RedisDataType]: number // Count of keys by type
  }
}

/**
 * List Databases Response
 */
export type ListDatabasesResponseDto = {
  success: boolean
  databases?: DatabaseInfo[]
  totalKeys?: number // Total across all databases
  totalMemory?: number // Total across all databases
  error?: string
}

/**
 * Redis Info Overview Response
 */
export type RedisInfoResponseDto = {
  success: boolean
  info?: {
    server: {
      redis_version?: string
      os?: string
      uptime_in_seconds?: string
    }
    memory: {
      used_memory?: string
      used_memory_human?: string
      used_memory_peak?: string
      used_memory_peak_human?: string
      total_system_memory?: string
      total_system_memory_human?: string
      mem_fragmentation_ratio?: string
    }
    clients: {
      connected_clients?: string
      blocked_clients?: string
    }
    stats: {
      total_connections_received?: string
      total_commands_processed?: string
      instantaneous_ops_per_sec?: string
    }
    replication: {
      role?: string
      connected_slaves?: string
    }
    health: {
      ping?: string
    }
  }
  error?: string
}

/**
 * Get Database Info Response
 */
export type GetDatabaseInfoResponseDto = {
  success: boolean
  database?: DatabaseInfo
  error?: string
}

/**
 * Select Database Request
 */
export interface SelectDatabaseRequestDto {
  database: number // Database number (0-15)
}

export type SelectDatabaseResponseDto = {
  success: boolean
  message?: string
  currentDatabase?: number
  error?: string
}

/**
 * Flush Database Request
 */
export interface FlushDatabaseRequestDto {
  confirmation: string // Must match database number
}

export type FlushDatabaseResponseDto = {
  success: boolean
  message?: string
  keysDeleted?: number
  error?: string
}

/**
 * Flush All Request
 */
export interface FlushAllRequestDto {
  confirmation: string // Must match "FLUSH_ALL"
  doubleConfirmation: string // Must match "I_UNDERSTAND"
}

export type FlushAllResponseDto = {
  success: boolean
  message?: string
  totalKeysDeleted?: number
  databasesAffected?: number
  error?: string
}

/**
 * List Keys Query
 */
export interface ListKeysQueryDto {
  pattern?: string // Redis pattern (e.g., user:*, session:*)
  type?: RedisDataType[] // Filter by types
  cursor?: string // SCAN cursor for pagination
  count?: number // Number of keys per SCAN (default: 100)
  page?: number // Page number (for frontend pagination)
  limit?: number // Items per page (default: 25, max: 1000)
  db?: number // Database number (default: 0)
}

export type ListKeysResponseDto = {
  success: boolean
  keys?: RedisKey[]
  total?: number // Total estimated keys
  cursor?: string // Next cursor for SCAN
  hasMore?: boolean // Whether more keys are available
  error?: string
}

/**
 * Get Key Details Query
 */
export interface GetKeyQueryDto {
  connectionId: string
  db?: number // Database number (default: 0)
}

export type GetKeyResponseDto = {
  success: boolean
  key?: RedisKey
  value?: unknown // Type-specific value
  error?: string
}

/**
 * Create Key Request
 */
export interface CreateKeyRequestDto {
  key: string
  type: RedisDataType
  value: unknown // Type-specific value
  ttl?: number // TTL in seconds (optional)
  db?: number // Database number (default: 0)
}

export type CreateKeyResponseDto = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Update Key Request
 */
export interface UpdateKeyRequestDto {
  value: unknown // Type-specific value
  db?: number // Database number (default: 0)
}

export type UpdateKeyResponseDto = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Delete Key Request
 */
export interface DeleteKeyRequestDto {
  db?: number // Database number (default: 0)
}

export type DeleteKeyResponseDto = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Set TTL Request
 */
export interface SetTtlRequestDto {
  ttl?: number // TTL in seconds, undefined to remove
  db?: number // Database number (default: 0)
}

export type SetTtlResponseDto = {
  success: boolean
  ttl?: number // New TTL
  message?: string
  error?: string
}

/**
 * Rename Key Request
 */
export interface RenameKeyRequestDto {
  newKey: string
  db?: number // Database number (default: 0)
  nx?: boolean // Don't overwrite if new key exists (RENAMENX)
}

export type RenameKeyResponseDto = {
  success: boolean
  message?: string
  error?: string
}

/**
 * Bulk Delete Request
 */
export interface BulkDeleteRequestDto {
  keys: string[]
  db?: number // Database number (default: 0)
}

export type BulkDeleteResponseDto = {
  success: boolean
  deleted?: number // Number of keys deleted
  failed?: string[] // Keys that failed to delete
  message?: string
  error?: string
}

/**
 * Type-specific value structures
 */

// Hash value
export interface HashValue {
  [field: string]: string
}

// List value
export interface ListValue {
  items: string[]
  total: number
}

// Set value
export interface SetValue {
  members: string[]
  total: number
}

// Sorted Set value
export interface ZSetValue {
  members: Array<{
    member: string
    score: number
  }>
  total: number
}

// Stream value
export interface StreamValue {
  entries: Array<{
    id: string
    fields: Record<string, string>
  }>
  total: number
  lastId?: string
  firstId?: string
}

/**
 * Type-specific operations for Hash
 */
export interface HashFieldOperationDto {
  field: string
  value?: string
  operation: 'get' | 'set' | 'delete'
}

export type HashFieldResponseDto = {
  success: boolean
  value?: string
  message?: string
  error?: string
}

/**
 * Type-specific operations for List
 */
export interface ListOperationDto {
  operation: 'lpush' | 'rpush' | 'lpop' | 'rpop' | 'lset' | 'lindex'
  index?: number // For lset, lindex
  value?: string // For push, set operations
  count?: number // For pop operations
}

export type ListOperationResponseDto = {
  success: boolean
  value?: string | string[]
  message?: string
  error?: string
}

/**
 * Type-specific operations for Set
 */
export interface SetOperationDto {
  operation: 'sadd' | 'srem' | 'smembers' | 'scard'
  members?: string[] // For sadd, srem
}

export type SetOperationResponseDto = {
  success: boolean
  members?: string[]
  count?: number
  message?: string
  error?: string
}

/**
 * Type-specific operations for Sorted Set
 */
export interface ZSetOperationDto {
  operation: 'zadd' | 'zrem' | 'zrange' | 'zcard'
  members?: Array<{ member: string; score?: number }>
  start?: number // For zrange
  stop?: number // For zrange
  withScores?: boolean // For zrange
}

export type ZSetOperationResponseDto = {
  success: boolean
  members?: Array<{ member: string; score?: number }>
  count?: number
  message?: string
  error?: string
}

/**
 * Type-specific operations for Stream
 */
export interface StreamOperationDto {
  operation: 'xadd' | 'xdel' | 'xrange' | 'xlen'
  id?: string // For xadd, xdel, xrange
  fields?: Record<string, string> // For xadd
  start?: string // For xrange
  end?: string // For xrange
  count?: number // For xrange
}

export type StreamOperationResponseDto = {
  success: boolean
  entries?: Array<{
    id: string
    fields: Record<string, string>
  }>
  count?: number
  message?: string
  error?: string
}
