import { 
  sqliteTable, 
  text, 
  integer, 
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'
import { users } from './users'

// Connections table - from connection management PRD
export const connections = sqliteTable('connections', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  name: text('name').notNull(),
  description: text('description'),
  host: text('host').notNull(),
  port: integer('port').notNull().default(6379),
  passwordEnc: text('password_enc'), // Encrypted password
  username: text('username'), // Redis 6+ ACL username
  database: integer('database').notNull().default(0),
  useTls: integer('use_tls', { mode: 'boolean' }).notNull().default(false),
  tlsCertPath: text('tls_cert_path'), // Custom certificate path
  isShared: integer('is_shared', { mode: 'boolean' }).notNull().default(false),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  lastStatus: text('last_status', { enum: ['connected', 'error', 'unknown'] }).default('unknown'),
  lastError: text('last_error'),
  lastUsed: integer('last_used', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => {
  return {
    ownerIdIdx: index('connections_owner_id_idx').on(table.ownerId),
    nameOwnerIdIdx: uniqueIndex('connections_name_owner_id_idx').on(table.name, table.ownerId),
  }
})

export type Connection = typeof connections.$inferSelect
export type NewConnection = typeof connections.$inferInsert
