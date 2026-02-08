import { Elysia } from 'elysia'
import { requireAuth } from '@/server/plugins/roles'
import { createUser } from '@/server/controllers/users'
import { logAudit, getClientIP, getUserAgent } from '@/server/lib/audit'
import type {
  RegisterRequestDto,
  RegisterResponseDto,
} from '@/types'
import { createUserSchema } from '@/types'

/**
 * Registration routes (authenticated user creates another account)
 */
export const registerRoutes = new Elysia({ prefix: '/auth' })
  .use(requireAuth())
  .post('/register', async ({ body, user, set, request }): Promise<RegisterResponseDto> => {
    try {
      const payload = body as RegisterRequestDto

      if (user.role !== 'admin' && payload.role === 'admin') {
        set.status = 403
        return {
          success: false,
          error: 'Only admins can create admin users',
        }
      }

      const result = await createUser(payload)
      if (!result.success) {
        set.status = result.error?.includes('exists') ? 409 : 400
        return result
      }

      // Log user creation
      await logAudit({
        userId: user.id,
        action: 'user.created',
        resourceType: 'user',
        resourceId: result.user?.id,
        resourceName: payload.username,
        details: JSON.stringify({
          createdBy: user.username,
          role: payload.role
        }),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Register user error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Failed to register user',
      }
    }
  }, {
    body: createUserSchema,
  })
