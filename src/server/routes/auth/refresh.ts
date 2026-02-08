import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { refreshSession } from '@/server/controllers/auth'
import {
  buildAuthCookie,
  clearAuthCookie,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  LEGACY_REFRESH_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE
} from '@/server/lib/auth-cookies'
import { env } from '@/env'
import type { RefreshResponseDto } from '@/types'

/**
 * Refresh route - rotates refresh token and issues a new access token
 */
export const refreshRoutes = new Elysia({ prefix: '/auth' })
  .use(jwt({ name: 'jwt', secret: env.JWT_SECRET }))
  .post('/refresh', async ({ request, set, jwt }): Promise<RefreshResponseDto> => {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = parseCookies(cookieHeader)
    const refreshToken = cookies[REFRESH_TOKEN_COOKIE] || cookies[LEGACY_REFRESH_TOKEN_COOKIE]

    if (!refreshToken) {
      set.status = 401
      const setCookieHeaders = [
        clearAuthCookie(ACCESS_TOKEN_COOKIE),
        clearAuthCookie(REFRESH_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_ACCESS_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_REFRESH_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_TOKEN_COOKIE),
      ]
      set.headers['Set-Cookie'] = setCookieHeaders as unknown as string
      return {
        success: false,
        error: 'Missing refresh token',
      }
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || undefined

    const result = await refreshSession(refreshToken, ipAddress, userAgent)

    if (!result.success || !result.user || !result.sessionId || !result.refreshToken || !result.refreshExpiresAt) {
      set.status = 401
      const setCookieHeaders = [
        clearAuthCookie(ACCESS_TOKEN_COOKIE),
        clearAuthCookie(REFRESH_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_ACCESS_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_REFRESH_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_TOKEN_COOKIE),
      ]
      set.headers['Set-Cookie'] = setCookieHeaders as unknown as string
      return {
        success: false,
        error: result.error || 'Invalid refresh token',
      }
    }

    const accessTtlSeconds = env.ACCESS_TOKEN_TTL_MINUTES * 60
    const accessExpiresAt = new Date(Date.now() + accessTtlSeconds * 1000)

    const token = await jwt.sign({
      sub: result.user.id,
      username: result.user.username,
      role: result.user.role,
      sid: result.sessionId,
      exp: Math.floor(accessExpiresAt.getTime() / 1000),
    })

    const refreshExpiresAt = new Date(result.refreshExpiresAt)
    const refreshMaxAge = Math.max(
      0,
      Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000)
    )

    const setCookieHeaders = [
      buildAuthCookie(ACCESS_TOKEN_COOKIE, token, accessTtlSeconds),
      buildAuthCookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshMaxAge),
      clearAuthCookie(LEGACY_ACCESS_TOKEN_COOKIE),
      clearAuthCookie(LEGACY_REFRESH_TOKEN_COOKIE),
      clearAuthCookie(LEGACY_TOKEN_COOKIE),
    ]
    set.headers['Set-Cookie'] = setCookieHeaders as unknown as string

    return {
      success: true,
      message: 'Session refreshed',
      user: result.user,
      accessExpiresAt: accessExpiresAt.toISOString(),
      refreshExpiresAt: result.refreshExpiresAt,
    }
  })

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=')
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=')
    }
  })

  return cookies
}
