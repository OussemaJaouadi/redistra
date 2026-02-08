/**
 * Users Controllers
 * Handles user management operations
 */

import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, like, or, desc } from 'drizzle-orm'
import { hashPassword, validatePasswordComplexity } from '@/server/lib/password'
import { nanoid } from 'nanoid'
import type { 
  User,
  ListUsersQueryDto,
  ListUsersResponseDto,
  GetUserResponseDto,
  CreateUserRequestDto,
  CreateUserResponseDto,
  UpdateUserRequestDto,
  UpdateUserResponseDto,
  DeleteUserResponseDto,
  ResetPasswordRequestDto,
  ResetPasswordResponseDto
} from '@/types'

/**
 * List users with pagination and filtering
 */
export async function listUsers(query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
  const { 
    page = 1, 
    limit = 50, 
    search,
    role,
    isActive,
  } = query

  const conditions = []

  if (search) {
    conditions.push(like(users.username, `%${search}%`))
  }

  if (role) {
    conditions.push(eq(users.role, role))
  }

  if (isActive !== undefined) {
    conditions.push(eq(users.isActive, isActive))
  }

  // Get total count
  const totalResult = await db
    .select({ count: users.id })
    .from(users)
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .then(rows => rows.length)

  // Get paginated users
  const usersList = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(conditions.length > 0 ? or(...conditions) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  return {
    success: true,
    users: usersList as User[],
    pagination: {
      page,
      limit,
      total: totalResult,
      totalPages: Math.ceil(totalResult / limit),
    },
  }
}

/**
 * Get single user
 */
export async function getUser(userId: string): Promise<GetUserResponseDto> {
  const user = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      failedLoginAttempts: users.failedLoginAttempts,
      lockedUntil: users.lockedUntil,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  return {
    success: true,
    user: user as GetUserResponseDto["user"],
  }
}

/**
 * Create new user
 */
export async function createUser(data: CreateUserRequestDto): Promise<CreateUserResponseDto> {
  const normalizedUsername = data.username.trim()
  const { password, role, isActive = true } = data

  // Validate username format
  if (!normalizedUsername) {
    return {
      success: false,
      error: 'Username is required',
    }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
    return {
      success: false,
      error: 'Username can only contain letters, numbers, and underscores',
    }
  }

  // Check if username already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.username, normalizedUsername))
    .limit(1)
    .then(rows => rows[0])

  if (existingUser) {
    return {
      success: false,
      error: 'Username already exists',
    }
  }

  // Validate password complexity
  const passwordValidation = validatePasswordComplexity(password)
  if (!passwordValidation.valid) {
    return {
      success: false,
      error: 'Password does not meet complexity requirements',
      details: passwordValidation.errors,
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user
  const userId = nanoid()
  await db.insert(users).values({
    id: userId,
    username: normalizedUsername,
    passwordHash,
    role,
    isActive,
    failedLoginAttempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const newUser = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0])

  return {
    success: true,
    user: newUser as User,
  }
}

/**
 * Update user
 */
export async function updateUser(
  userId: string, 
  data: UpdateUserRequestDto,
  currentUserId: string
): Promise<UpdateUserResponseDto> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  // Prevent self-demotion from admin if last admin
  if (userId === currentUserId && data.role && data.role !== 'admin') {
    const adminCount = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .then(rows => rows.length)

    if (adminCount === 1) {
      return {
        success: false,
        error: 'Cannot demote the only admin user',
      }
    }
  }

  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (data.username) {
    // Check username uniqueness
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1)
      .then(rows => rows[0])

    if (existing && existing.id !== userId) {
      return {
        success: false,
        error: 'Username already exists',
      }
    }

    updateData.username = data.username
  }

  if (data.role) updateData.role = data.role
  if (data.isActive !== undefined) updateData.isActive = data.isActive

  await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))

  const updatedUser = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0])

  return {
    success: true,
    user: updatedUser as User,
  }
}

/**
 * Delete user
 */
export async function deleteUser(
  userId: string,
  currentUserId: string
): Promise<DeleteUserResponseDto> {
  // Prevent self-deletion
  if (userId === currentUserId) {
    return {
      success: false,
      error: 'Cannot delete your own account',
    }
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  // Prevent deleting last admin
  if (user.role === 'admin') {
    const adminCount = await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.role, 'admin'))
      .then(rows => rows.length)

    if (adminCount === 1) {
      return {
        success: false,
        error: 'Cannot delete the only admin user',
      }
    }
  }

  await db.delete(users).where(eq(users.id, userId))

  return {
    success: true,
    message: 'User deleted successfully',
  }
}

/**
 * Reset user password
 */
export async function resetUserPassword(
  userId: string,
  data: ResetPasswordRequestDto
): Promise<ResetPasswordResponseDto> {
  const { newPassword, confirmPassword } = data

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: 'Passwords do not match',
    }
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then(rows => rows[0])

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  // Validate password complexity
  const passwordValidation = validatePasswordComplexity(newPassword)
  if (!passwordValidation.valid) {
    return {
      success: false,
      error: 'Password does not meet complexity requirements',
      details: passwordValidation.errors,
    }
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword)

  // Update password and reset login attempts
  await db
    .update(users)
    .set({
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  return {
    success: true,
    message: 'Password reset successfully',
  }
}
