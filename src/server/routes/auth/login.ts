import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { login as loginController } from '@/server/controllers/auth'
import { env } from '@/env'
import {
  buildAuthCookie,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
  LEGACY_REFRESH_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE,
  clearAuthCookie
} from '@/server/lib/auth-cookies'
import { logAudit } from '@/server/lib/audit'
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts, getRemainingAttempts } from '@/server/lib/brute-force'
import type { LoginResponseDto } from '@/types'
import { loginSchema } from '@/types'

/**
 * Login route - authenticates user and creates session
 */
export const loginRoutes = new Elysia({ prefix: '/auth' })
  .use(jwt({ name: 'jwt', secret: env.JWT_SECRET }))
  .post('/login', async ({ body, set, request, jwt }): Promise<LoginResponseDto> => {
    try {
      // Get IP and User Agent
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
      const userAgent = request.headers.get('user-agent') || undefined

      // Check brute force protection
      const lockStatus = isAccountLocked(ipAddress, body.username)
      if (lockStatus.locked) {
        set.status = 423
        
        // Log blocked attempt
        await logAudit({
          userId: null,
          action: 'auth.login_blocked',
          resourceType: 'auth',
          resourceId: body.username,
          resourceName: body.username,
          details: JSON.stringify({ 
            reason: 'Account locked due to too many failed attempts',
            remainingTime: lockStatus.remainingTime
          }),
          ipAddress,
          userAgent
        })
        
        return {
          success: false,
          error: `Account temporarily locked due to too many failed attempts. Please try again in ${Math.ceil((lockStatus.remainingTime || 0) / 60)} minutes.`,
        }
      }

      const result = await loginController(body, ipAddress, userAgent)

      if (!result.success) {
        // Record failed attempt for brute force protection
        const lockStatus = recordFailedAttempt(ipAddress, body.username)
        const remainingAttempts = getRemainingAttempts(ipAddress, body.username)
        
        set.status = result.error?.includes('locked') ? 423 : 
                     result.error?.includes('disabled') ? 403 : 401
        
        // Log failed login attempt
        await logAudit({
          userId: null,
          action: 'auth.login_failed',
          resourceType: 'auth',
          resourceId: body.username,
          resourceName: body.username,
          details: JSON.stringify({ 
            reason: result.error,
            remainingAttempts: lockStatus.locked ? 0 : remainingAttempts
          }),
          ipAddress,
          userAgent
        })
        
        // If account just got locked, return lock message
        if (lockStatus.locked) {
          set.status = 423
          return {
            success: false,
            error: `Account temporarily locked due to too many failed attempts. Please try again in ${Math.ceil((lockStatus.remainingTime || 0) / 60)} minutes.`,
          }
        }
        
        return {
          success: false,
          error: result.error,
        }
      }

      if (!result.sessionId || !result.refreshToken || !result.expiresAt) {
        set.status = 500
        return {
          success: false,
          error: 'Login failed to create session',
        }
      }

      const accessTtlSeconds = env.ACCESS_TOKEN_TTL_MINUTES * 60
      const accessExpiresAt = new Date(Date.now() + accessTtlSeconds * 1000)

      // Generate JWT using Elysia's plugin
      const token = await jwt.sign({
        sub: result.user!.id,
        username: result.user!.username,
        role: result.user!.role,
        sid: result.sessionId,
        exp: Math.floor(accessExpiresAt.getTime() / 1000),
      })

      const refreshExpiresAt = new Date(result.expiresAt)
      const refreshMaxAge = Math.max(
        0,
        Math.floor((refreshExpiresAt.getTime() - Date.now()) / 1000)
      )

      const cookies = [
        buildAuthCookie(ACCESS_TOKEN_COOKIE, token, accessTtlSeconds),
        buildAuthCookie(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshMaxAge),
        clearAuthCookie(LEGACY_ACCESS_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_REFRESH_TOKEN_COOKIE),
        clearAuthCookie(LEGACY_TOKEN_COOKIE),
      ]
      set.headers['Set-Cookie'] = cookies as unknown as string

      // Clear failed attempts on successful login
      clearFailedAttempts(ipAddress, body.username)

      // Log successful login
      await logAudit({
        userId: result.user!.id,
        action: 'auth.login',
        resourceType: 'auth',
        resourceId: result.user!.id,
        resourceName: result.user!.username,
        details: JSON.stringify({ sessionId: result.sessionId }),
        ipAddress,
        userAgent
      })

      return {
        success: true,
        message: 'Login successful',
        user: result.user!,
        expiresAt: result.expiresAt,
        accessExpiresAt: accessExpiresAt.toISOString(),
        refreshExpiresAt: result.expiresAt,
      }
    } catch (error) {
      console.error('Login error:', error)
      set.status = 500
      return {
        success: false,
        error: 'Login failed',
      }
    }
  }, {
    body: loginSchema,
  })
