/// <reference types="@types/bun" />

interface ParsedConnection {
  host: string
  port: number
  username?: string
  password?: string
  database: number
  useTls: boolean
}

/**
 * Parse Redis connection string into individual components
 * Formats supported:
 * - redis://host:port
 * - redis://host:port/database
 * - redis://username:password@host:port
 * - redis://username:password@host:port/database
 * - rediss://... (TLS)
 */
export function parseConnectionString(connectionString: string): ParsedConnection {
  const url = new URL(connectionString)
  
  // Determine TLS from scheme
  const useTls = url.protocol === 'rediss:'
  
  // Extract components
  const host = url.hostname || 'localhost'
  const port = url.port ? parseInt(url.port, 10) : 6379
  const username = url.username ? decodeURIComponent(url.username) : undefined
  const password = url.password ? decodeURIComponent(url.password) : undefined
  const database = url.pathname ? parseInt(url.pathname.slice(1), 10) || 0 : 0

  return {
    host,
    port,
    username: username || undefined,
    password: password || undefined,
    database,
    useTls,
  }
}

/**
 * Validate connection string format
 */
export function isValidConnectionString(connectionString: string): boolean {
  try {
    const url = new URL(connectionString)
    return url.protocol === 'redis:' || url.protocol === 'rediss:'
  } catch {
    return false
  }
}
