import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '../env'
import * as schema from './schema'

// Create data directory if it doesn't exist
import { mkdirSync } from 'fs'
import { dirname } from 'path'
const dbPath = env.DATABASE_URL.startsWith('./') ? env.DATABASE_URL : `./${env.DATABASE_URL}`
const dbDir = dirname(dbPath)
mkdirSync(dbDir, { recursive: true })

// Create database connection using libsql
const sqlite = createClient({
  url: `file:${dbPath}`
})

// Create Drizzle instance
export const db = drizzle(sqlite, {
  schema,
  logger: env.NODE_ENV === 'development' && env.DB_LOGGING
})

export * from './schema'
export { schema }
