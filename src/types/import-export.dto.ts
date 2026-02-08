/**
 * Import/Export DTOs
 */


/**
 * Export Keys Request
 */
export interface ExportKeysRequestDto {
  format: 'json' | 'csv'
  database?: number // 0-15, default: 0
  pattern?: string // Key pattern filter
  type?: string // Redis data type filter
  includeTTL?: boolean // Include TTL in export
  includeValues?: boolean // Include values in export
  limit?: number // Max keys to export
}

/**
 * Export Connection Request
 */
export interface ExportConnectionRequestDto {
  connectionId: string
  format?: 'json' // Only JSON for connections
}

/**
 * Export Database Request
 */
export interface ExportDatabaseRequestDto {
  connectionId: string
  database?: number // 0-15, default: current
  format: 'rdb' | 'json'
  includeAllDatabases?: boolean // Export all databases
}

/**
 * Import Keys Request
 */
export interface ImportKeysRequestDto {
  connectionId: string // Target Redis connection
  format: 'json' | 'csv'
  conflictResolution: 'skip' | 'overwrite' | 'rename'
  database?: number // Target database, default: 0
  validateTTL?: boolean // Validate TTL format
  dryRun?: boolean // Preview without importing
}

/**
 * Import Connection Request
 */
export interface ImportConnectionRequestDto {
  name: string
  host: string
  port: number
  password?: string
  database?: number
  useTls?: boolean
  testConnection?: boolean // Test before saving
  conflictResolution?: 'skip' | 'rename' // Handle duplicate names
}

/**
 * Import RDB Request (Admin Only)
 */
export interface ImportRDBRequestDto {
  connectionId: string
  database?: number // Target database, default: 0
  overwriteExisting?: boolean // Overwrite existing data
}

/**
 * Export Status Response
 */
export interface ExportStatusResponseDto {
  success: boolean
  exportId?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: number // 0-100
  downloadUrl?: string
  fileSize?: number
  recordCount?: number
  error?: string
}

/**
 * Export Keys Response
 */
export type ExportKeysResponseDto = {
  success: boolean
  exportId?: string
  message?: string
  error?: string
}

/**
 * Export Connection Response
 */
export type ExportConnectionResponseDto = {
  success: boolean
  exportId?: string
  message?: string
  error?: string
}

/**
 * Export Database Response
 */
export type ExportDatabaseResponseDto = {
  success: boolean
  exportId?: string
  message?: string
  error?: string
}

/**
 * Import Keys Response
 */
export type ImportKeysResponseDto = {
  success: boolean
  imported?: number
  skipped?: number
  errors?: number
  conflicts?: number
  preview?: Array<{
    key: string
    type: string
    value: unknown
    action: 'create' | 'skip' | 'overwrite' | 'rename'
  }>
  error?: string
}

/**
 * Import Connection Response
 */
export type ImportConnectionResponseDto = {
  success: boolean
  connectionId?: string
  message?: string
  error?: string
}

/**
 * Import RDB Response
 */
export type ImportRDBResponseDto = {
  success: boolean
  keysImported?: number
  databasesAffected?: number
  message?: string
  error?: string
}

/**
 * Export Job Status (in-memory tracking)
 */
export interface ExportJob {
  id: string
  userId: string
  type: 'keys' | 'connection' | 'database'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  filePath?: string
  fileSize?: number
  recordCount?: number
  createdAt: Date
  completedAt?: Date
  error?: string
}

/**
 * Import Preview Item
 */
export interface ImportPreviewItem {
  key: string
  type: string
  value: unknown
  ttl?: number
  action: 'create' | 'skip' | 'overwrite' | 'rename'
  newKey?: string // For rename conflicts
}

/**
 * Exported Key
 */
export interface ExportedKey {
  key: string
  type: string
  value?: unknown
  ttl?: number
  database?: number
}

/**
 * Exported Connection
 */
export interface ExportedConnection {
  name: string
  host: string
  port: number
  database?: number
  useTls?: boolean
  // Note: Password is encrypted or excluded
}

/**
 * Exported Database
 */
export interface ExportedDatabase {
  version: string
  exportedAt: string
  database: number
  keys: ExportedKey[]
}
