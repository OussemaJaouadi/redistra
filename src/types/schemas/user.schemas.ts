/**
 * User management validation schemas (TypeBox)
 */

import { t } from 'elysia'

export const createUserSchema = t.Object({
  username: t.String({ minLength: 3, maxLength: 50 }),
  password: t.String({ minLength: 8 }),
  role: t.Union([t.Literal('admin'), t.Literal('editor'), t.Literal('viewer')]),
  isActive: t.Optional(t.Boolean()),
})

export const updateUserSchema = t.Object({
  username: t.Optional(t.String({ minLength: 3, maxLength: 50 })),
  role: t.Optional(t.Union([t.Literal('admin'), t.Literal('editor'), t.Literal('viewer')])),
  isActive: t.Optional(t.Boolean()),
})

export const resetPasswordSchema = t.Object({
  newPassword: t.String({ minLength: 8 }),
  confirmPassword: t.String(),
})

export const listUsersQuerySchema = t.Object({
  page: t.Optional(t.Number({ minimum: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  search: t.Optional(t.String()),
  role: t.Optional(t.Union([t.Literal('admin'), t.Literal('editor'), t.Literal('viewer')])),
  isActive: t.Optional(t.Boolean()),
})
