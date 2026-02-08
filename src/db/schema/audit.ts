import { 
  sqliteTable, 
  text, 
  integer, 
  index,
} from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'
import { users } from './users'

// Audit logs table - from audit logging PRD
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(), // e.g., 'create', 'update', 'delete', 'login', 'logout'
  resourceType: text('resource_type').notNull(), // e.g., 'user', 'connection', 'key'
  resourceId: text('resource_id'), // ID of the affected resource
  resourceName: text('resource_name'), // Human-readable name
  details: text('details'), // JSON string with additional details
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => {
  return {
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
    resourceIdx: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
  }
})

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
