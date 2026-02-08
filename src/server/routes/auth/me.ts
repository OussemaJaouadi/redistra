import { Elysia } from 'elysia'
import { requireAuth } from '@/server/plugins/roles'
import { getCurrentUser } from '@/server/controllers/auth'
import type { MeResponseDto } from '@/types'

/**
 * Current user route - returns authenticated user info
 */
export const meRoutes = new Elysia({ prefix: '/auth' })
  .use(requireAuth())
  .get('/me', async ({ user }): Promise<MeResponseDto> => {
    return getCurrentUser(user)
  })
