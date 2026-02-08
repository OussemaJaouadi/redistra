import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { db } from '@/db'
import { users, sessions } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { env } from '@/env'
import type { AuthPluginOptions, AuthUser } from '@/types'
import {
  ACCESS_TOKEN_COOKIE,
  LEGACY_ACCESS_TOKEN_COOKIE,
  LEGACY_TOKEN_COOKIE
} from '@/server/lib/auth-cookies'

/**
 * Authentication plugin for Elysia routes
 * Validates JWT token, checks session, and enforces role-based access
 */
export const authPlugin = (options?: AuthPluginOptions) => {
  return new Elysia({ name: 'auth' })
    .use(jwt({ name: 'jwt', secret: env.JWT_SECRET }))
    .derive({ as: 'scoped' }, async ({ headers, set, jwt }) => {
      // Get token from Authorization header or cookie
      let token: string | null = null

      // Try Authorization header first
      const authHeader = headers.authorization
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }

      // Try cookie as fallback
      if (!token) {
        const cookieHeader = headers.cookie
        if (cookieHeader) {
          const cookies = parseCookies(cookieHeader)
          token = cookies[ACCESS_TOKEN_COOKIE] || cookies[LEGACY_ACCESS_TOKEN_COOKIE] || cookies[LEGACY_TOKEN_COOKIE] || null
        }
      }

      if (!token) {
        set.status = 401
        throw new Error('Unauthorized: No token provided')
      }

      // Verify JWT
      const payload = await jwt.verify(token)
      if (!payload || !payload.sub || !payload.sid) {
        set.status = 401
        throw new Error('Unauthorized: Invalid token')
      }

      // Check if session exists and is valid
      const session = await db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, payload.sid as string),
            eq(sessions.userId, payload.sub as string),
            gt(sessions.expiresAt, new Date())
          )
        )
        .limit(1)
        .then(rows => rows[0])

      if (!session) {
        set.status = 401
        throw new Error('Unauthorized: Session expired')
      }

      // Get user
      const user = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.id, payload.sub as string),
            eq(users.isActive, true)
          )
        )
        .limit(1)
        .then(rows => rows[0])

      if (!user) {
        set.status = 401
        throw new Error('Unauthorized: User not found or inactive')
      }

      // Check role if required
      if (options?.requiredRole) {
        const roleHierarchy: Record<string, number> = {
          viewer: 1,
          editor: 2,
          admin: 3,
        }

        const userLevel = roleHierarchy[user.role] || 0
        const requiredLevel = roleHierarchy[options.requiredRole] || 0

        if (userLevel < requiredLevel) {
          set.status = 403
          throw new Error('Forbidden: Insufficient permissions')
        }
      }

      // Check if user role is in the allowed roles list
      if (options?.requiredRoles && options.requiredRoles.length > 0) {
        if (!options.requiredRoles.includes(user.role)) {
          set.status = 403
          throw new Error('Forbidden: Insufficient permissions')
        }
      }

      return {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        } as AuthUser,
      }
    })
}

/**
 * Parse cookies from header
 */
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
