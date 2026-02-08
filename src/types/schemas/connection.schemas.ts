/**
 * Connection management validation schemas (TypeBox)
 */

import { t } from 'elysia'

export const manualConnectionSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  host: t.String({ minLength: 1, maxLength: 255 }),
  port: t.Optional(t.Number({ minimum: 1, maximum: 65535 })),
  password: t.Optional(t.String()),
  username: t.Optional(t.String()),
  database: t.Optional(t.Number({ minimum: 0, maximum: 15 })),
  useTls: t.Optional(t.Boolean()),
  isShared: t.Optional(t.Boolean()),
})

export const connectionStringSchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  connectionString: t.String({ minLength: 1 }),
  isShared: t.Optional(t.Boolean()),
})

export const createConnectionSchema = t.Union([
  manualConnectionSchema,
  connectionStringSchema,
])

export const testConnectionManualSchema = t.Object({
  host: t.String({ minLength: 1 }),
  port: t.Optional(t.Number({ minimum: 1, maximum: 65535 })),
  password: t.Optional(t.String()),
  username: t.Optional(t.String()),
  database: t.Optional(t.Number({ minimum: 0, maximum: 15 })),
  useTls: t.Optional(t.Boolean()),
})

export const testConnectionStringSchema = t.Object({
  connectionString: t.String({ minLength: 1 }),
})

export const testConnectionSchema = t.Union([
  testConnectionManualSchema,
  testConnectionStringSchema,
])

export const updateConnectionSchema = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100 })),
  description: t.Optional(t.String({ maxLength: 500 })),
  host: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  port: t.Optional(t.Number({ minimum: 1, maximum: 65535 })),
  password: t.Optional(t.String()),
  username: t.Optional(t.String()),
  database: t.Optional(t.Number({ minimum: 0, maximum: 15 })),
  useTls: t.Optional(t.Boolean()),
  isShared: t.Optional(t.Boolean()),
})
