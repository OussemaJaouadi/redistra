/**
 * Shared validation schemas and helper types
 */

/**
 * Parsed connection from connection string
 */
export interface ParsedConnection {
  host: string
  port: number
  username?: string
  password?: string
  database: number
  useTls: boolean
}

/**
 * Host validation result
 */
export interface HostValidationResult {
  valid: boolean
  error?: string
}
