/**
 * Connection Management DTOs
 */


/**
 * Connection status
 */
export type ConnectionStatus = 'connected' | 'error' | 'unknown'

/**
 * Connection entity
 */
export interface Connection {
  id: string
  name: string
  description: string | null
  host: string
  port: number
  username: string | null
  database: number
  useTls: boolean
  isShared: boolean
  ownerId: string
  lastStatus: ConnectionStatus | null
  lastError: string | null
  lastUsed: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Connection configuration (for internal use)
 */
export interface ConnectionConfig {
  id: string
  host: string
  port: number
  password?: string
  username?: string
  database: number
  useTls: boolean
}

/**
 * List Connections
 */
export interface ListConnectionsQueryDto {
  page?: number
  limit?: number
  search?: string
  isShared?: boolean
}

export type ListConnectionsResponseDto = {
  success: boolean
  connections: {
    my: Connection[]
    shared: Connection[]
  }
  error?: string
}

/**
 * Get Connection
 */
export interface GetConnectionResponseDto {
  success: boolean
  connection?: Connection
  error?: string
}

/**
 * Get Connection Secret (password)
 */
export interface GetConnectionSecretResponseDto {
  success: boolean
  password?: string | null
  error?: string
}

/**
 * Create Connection (Manual)
 */
export interface CreateConnectionManualDto {
  name: string
  description?: string
  host: string
  port?: number
  password?: string
  username?: string
  database?: number
  useTls?: boolean
  isShared?: boolean
}

/**
 * Create Connection (Connection String)
 */
export interface CreateConnectionStringDto {
  name: string
  description?: string
  connectionString: string
  isShared?: boolean
}

export type CreateConnectionRequestDto = 
  | CreateConnectionManualDto 
  | CreateConnectionStringDto

export interface CreateConnectionResponseDto {
  success: boolean
  message?: string
  error?: string
  connection?: Connection
}

/**
 * Update Connection
 */
export type UpdateConnectionRequestDto = Partial<Omit<CreateConnectionManualDto, 'name'>> & {
  name?: string
}

export interface UpdateConnectionResponseDto {
  success: boolean
  message?: string
  error?: string
  connection?: Connection
}

/**
 * Delete Connection
 */
export interface DeleteConnectionResponseDto {
  success: boolean
  message?: string
  error?: string
}

/**
 * Test Connection
 */
export type TestConnectionRequestDto =
  | {
      host: string
      port?: number
      password?: string
      username?: string
      database?: number
      useTls?: boolean
    }
  | {
      connectionString: string
    }

export interface TestConnectionResponseDto {
  success: boolean
  error?: string
  latencyMs?: number
  serverInfo?: string
}

/**
 * Connect to Redis
 */
export interface ConnectResponseDto {
  success: boolean
  message?: string
  error?: string
}

/**
 * Disconnect from Redis
 */
export interface DisconnectResponseDto {
  success: boolean
  message?: string
  error?: string
}
