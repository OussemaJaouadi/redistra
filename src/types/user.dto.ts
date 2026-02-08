/**
 * User Management DTOs
 */

import type { UserRole, User } from './api'

/**
 * List Users
 */
export interface ListUsersQueryDto {
  page?: number
  limit?: number
  search?: string
  role?: UserRole
  isActive?: boolean
}

export interface ListUsersResponseDto {
  success: boolean
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

/**
 * Get User
 */
export interface GetUserResponseDto {
  success: boolean
  user?: User & {
    failedLoginAttempts: number
    lockedUntil: Date | null
  }
  error?: string
}

/**
 * Create User
 */
export interface CreateUserRequestDto {
  username: string
  password: string
  role: UserRole
  isActive?: boolean
}

export interface CreateUserResponseDto {
  success: boolean
  message?: string
  error?: string
  details?: string[]
  user?: User
}

/**
 * Update User
 */
export interface UpdateUserRequestDto {
  username?: string
  role?: UserRole
  isActive?: boolean
}

export interface UpdateUserResponseDto {
  success: boolean
  message?: string
  error?: string
  user?: User
}

/**
 * Delete User
 */
export interface DeleteUserResponseDto {
  success: boolean
  message?: string
  error?: string
}

/**
 * Reset Password
 */
export interface ResetPasswordRequestDto {
  newPassword: string
  confirmPassword: string
}

export interface ResetPasswordResponseDto {
  success: boolean
  message?: string
  error?: string
  details?: string[]
}

/**
 * Toggle User Status
 */
export interface ToggleUserStatusRequestDto {
  isActive: boolean
}

export interface ToggleUserStatusResponseDto {
  success: boolean
  message?: string
  error?: string
}
