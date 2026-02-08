/**
 * Bootstrap helpers for server startup
 */

import { nanoid } from 'nanoid'
import path from 'path'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { db } from '@/db'
import { users } from '@/db/schema'
import { env } from '@/env'
import { hashPassword } from '@/server/lib/password'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/
const MIGRATIONS_DIR = path.join(process.cwd(), 'src/db/migrations')
let bootstrapPromise: Promise<void> | null = null

async function ensureSeedAdmin(): Promise<void> {
  const existingUsers = await db.select({ id: users.id }).from(users).limit(1)
  if (existingUsers.length > 0) {
    return
  }

  const username = env.ADMIN_USERNAME?.trim()
  const password = env.ADMIN_PASSWORD

  if (!username || !password) {
    throw new Error('ADMIN_USERNAME and ADMIN_PASSWORD are required to seed the initial admin user')
  }

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('ADMIN_USERNAME can only contain letters, numbers, and underscores')
  }

  const passwordHash = await hashPassword(password)

  await db.insert(users).values({
    id: nanoid(),
    username,
    passwordHash,
    role: 'admin',
    isActive: true,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

export async function ensureBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await migrate(db, { migrationsFolder: MIGRATIONS_DIR })
      await ensureSeedAdmin()
    })()
  }

  return bootstrapPromise
}
