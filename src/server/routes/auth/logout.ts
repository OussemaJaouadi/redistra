import { Elysia } from 'elysia'
import { requireAuth } from '@/server/plugins/roles'
import { logout as logoutController } from '@/server/controllers/auth'
import { clearAuthCookie, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, LEGACY_ACCESS_TOKEN_COOKIE, LEGACY_REFRESH_TOKEN_COOKIE, LEGACY_TOKEN_COOKIE } from '@/server/lib/auth-cookies'
import { logAudit, getClientIP, getUserAgent } from '@/server/lib/audit'
import type { LogoutResponseDto } from '@/types'

/**
 * Logout route - invalidates session and clears cookie
 */
export const logoutRoutes = new Elysia({ prefix: '/auth' })
  .use(requireAuth())
  .post('/logout', async ({ user, set, request }): Promise<LogoutResponseDto> => {
    try {
      const result = await logoutController(user.id)

      // Clear cookie
      const cookies = [
        clearAuthCookie(ACCESS_TOKEN_COOKIE),
        clearAuthCookie(REFRESH_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_ACCESS_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_REFRESH_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_TOKEN_COOKIE),
      ]
      set.headers['Set-Cookie'] = cookies as unknown as string

      // Log logout
      await logAudit({
        userId: user.id,
        action: 'auth.logout',
        resourceType: 'auth',
        resourceId: user.id,
        resourceName: user.username,
        details: JSON.stringify({}),
        ipAddress: getClientIP(request),
        userAgent: getUserAgent(request)
      })

      return result
    } catch (error) {
      console.error('Logout error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Logout failed',
      }
    }
  })
