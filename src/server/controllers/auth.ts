/**
 * Auth Controllers
 * Pure functions that handle auth business logic
 */

import { db } from '@/db'
import { users, sessions } from '@/db/schema'
import { and, eq, gt } from 'drizzle-orm'
import { verifyPassword } from '@/server/lib/password'
import { nanoid } from 'nanoid'
import { env } from '@/env'
import { generateRefreshToken, hashToken } from '@/server/lib/tokens'
import type { 
  LoginRequestDto,
  LogoutResponseDto,
  MeResponseDto,
  AuthUser,
  UserRole
} from '@/types'

/**
 * Authenticate user and create session
 * Returns user data and session ID for JWT generation in route
 */
export async function login(
  data: LoginRequestDto, 
  ipAddress: string,
  userAgent?: string
): Promise<{ 
  success: boolean
  error?: string
  user?: { id: string; username: string; role: UserRole }
  sessionId?: string
  refreshToken?: string
  expiresAt?: string
}> {
  const { username, password, remember } = data
  const normalizedUsername = username.trim()
  if (!normalizedUsername) {
    return {
      success: false,
      error: 'Invalid credentials',
    }
  }

  // Find user
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, normalizedUsername))
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    return {
      success: false,
      error: 'Invalid credentials',
    }
  }

  // Check if user is active
  if (!user.isActive) {
    return {
      success: false,
      error: 'Account is disabled',
    }
  }

  // Check if account is locked
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMinutes = Math.ceil(
      (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
    )
    return {
      success: false,
      error: `Account is locked. Try again in ${remainingMinutes} minute(s)`,
    }
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash)

  if (!isValidPassword) {
    // Increment failed attempts
    const failedAttempts = user.failedLoginAttempts + 1
    const lockoutThreshold = env.LOGIN_LOCKOUT_ATTEMPTS

    const updateData: Partial<typeof users.$inferInsert> = {
      failedLoginAttempts: failedAttempts,
      updatedAt: new Date(),
    }

    // Lock account if threshold reached
    if (failedAttempts >= lockoutThreshold) {
      updateData.lockedUntil = new Date(
        Date.now() + env.LOGIN_LOCKOUT_DURATION_MINUTES * 60 * 1000
      )
    }

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))

    return {
      success: false,
      error: 'Invalid credentials',
    }
  }

  // Reset failed attempts on successful login
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))

  // Create session
  const sessionId = nanoid()
  const refreshToken = generateRefreshToken()
  const refreshTokenHash = hashToken(refreshToken)
  const sessionDays = remember ? env.REMEMBER_ME_TTL_DAYS : env.SESSION_TTL_DAYS
  const expiresAt = new Date(
    Date.now() + sessionDays * 24 * 60 * 60 * 1000
  )

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt,
    ipAddress,
    userAgent,
    createdAt: new Date(),
  })

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
    },
    sessionId,
    refreshToken,
    expiresAt: expiresAt.toISOString(),
  }
}

/**
 * Refresh session and rotate refresh token
 */
export async function refreshSession(
  refreshToken: string,
  ipAddress: string,
  userAgent?: string
): Promise<{
  success: boolean
  error?: string
  user?: { id: string; username: string; role: UserRole }
  sessionId?: string
  refreshToken?: string
  refreshExpiresAt?: string
}> {
  const tokenHash = hashToken(refreshToken)
  const session = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1)
    .then(rows => rows[0])

  if (!session) {
    return {
      success: false,
      error: 'Invalid refresh token',
    }
  }

  const user = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, session.userId),
        eq(users.isActive, true)
      )
    )
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    return {
      success: false,
      error: 'User not found or inactive',
    }
  }

  const newRefreshToken = generateRefreshToken()
  const newTokenHash = hashToken(newRefreshToken)

  await db
    .update(sessions)
    .set({
      tokenHash: newTokenHash,
      ipAddress,
      userAgent,
    })
    .where(eq(sessions.id, session.id))

  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role as UserRole,
    },
    sessionId: session.id,
    refreshToken: newRefreshToken,
    refreshExpiresAt: session.expiresAt.toISOString(),
  }
}

/**
 * Logout user and invalidate session
 */
export async function logout(userId: string): Promise<LogoutResponseDto> {
  // Delete all sessions for this user
  await db
    .delete(sessions)
    .where(eq(sessions.userId, userId))

  return {
    success: true,
    message: 'Logged out successfully',
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(user: AuthUser): Promise<MeResponseDto> {
  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  }
}
