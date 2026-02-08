/**
 * Auth validation schemas (TypeBox)
 */

import { t } from 'elysia'

export const loginSchema = t.Object({
  username: t.String(),
  password: t.String(),
  remember: t.Optional(t.Boolean()),
})
