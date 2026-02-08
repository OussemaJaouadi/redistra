import { 
  sqliteTable, 
  text, 
  integer, 
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'
import { users } from './users'

// System settings table - from settings preferences PRD
export const systemSettings = sqliteTable('system_settings', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  key: text('key').notNull(),
  value: text('value').notNull(), // JSON string for complex values
  category: text('category').notNull(), // e.g., 'security', 'audit', 'redis', 'app'
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false), // Readable by non-admin users
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => {
  return {
    keyIdx: uniqueIndex('system_settings_key_idx').on(table.key),
    categoryIdx: index('system_settings_category_idx').on(table.category),
  }
})

// User preferences table - from settings preferences PRD
export const userPreferences = sqliteTable('user_preferences', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: text('value').notNull(), // JSON string for complex values
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => {
  return {
    userIdKeyIdx: uniqueIndex('user_preferences_user_id_key_idx').on(table.userId, table.key),
    keyIdx: index('user_preferences_key_idx').on(table.key),
  }
})

export type SystemSetting = typeof systemSettings.$inferSelect
export type NewSystemSetting = typeof systemSettings.$inferInsert
export type UserPreference = typeof userPreferences.$inferSelect
export type NewUserPreference = typeof userPreferences.$inferInsert
