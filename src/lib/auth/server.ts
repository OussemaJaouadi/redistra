/**
 * Server-side authentication utilities
 * JWT verification for Next.js middleware and server components
 */

import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { and, eq, gt } from 'drizzle-orm'
import { env } from '@/env'
import { ACCESS_TOKEN_COOKIE, LEGACY_ACCESS_TOKEN_COOKIE, LEGACY_TOKEN_COOKIE } from '@/server/lib/auth-cookies'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import type { JWTPayload, UserRole } from '@/types'

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET)

/**
 * Verify JWT token from cookies (server-side)
 * Returns null if token is invalid or missing
 */
export async function verifyAuth(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token =
      cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ||
      cookieStore.get(LEGACY_ACCESS_TOKEN_COOKIE)?.value ||
      cookieStore.get(LEGACY_TOKEN_COOKIE)?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    // Validate payload structure
    if (!payload.sub || !payload.username || !payload.role || !payload.sid) {
      return null
    }

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
      return null
    }

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
      return null
    }

    return {
      sub: user.id,
      username: user.username,
      role: user.role as UserRole,
      sid: payload.sid as string,
      iat: payload.iat,
      exp: payload.exp,
    }
  } catch {
    // Token expired or invalid
    return null
  }
}

/**
 * Require authentication - throws if not authenticated
 * Use in server components and route handlers
 */
export async function requireAuth(): Promise<JWTPayload> {
  const user = await verifyAuth()
  
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

/**
 * Check if user has required role
 */
export async function hasRole(role: UserRole | UserRole[]): Promise<boolean> {
  const user = await verifyAuth()
  
  if (!user) {
    return false
  }
  
  const roles = Array.isArray(role) ? role : [role]
  
  // Admin has access to everything
  if (user.role === 'admin') {
    return true
  }
  
  // Editor has access to editor and viewer
  if (user.role === 'editor' && roles.some(r => r === 'editor' || r === 'viewer')) {
    return true
  }
  
  // Check exact role match
  return roles.includes(user.role)
}

/**
 * Require specific role - throws if user doesn't have required role
 */
export async function requireRole(role: UserRole | UserRole[]): Promise<JWTPayload> {
  const user = await requireAuth()
  
  if (!await hasRole(role)) {
    throw new Error('Forbidden')
  }
  
  return user
}

/**
 * Get current user for server components (convenience wrapper)
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  return verifyAuth()
}

/**
 * Check if current request is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await verifyAuth()
  return user !== null
}
