/**
 * Authentication DTOs
 */

import type { UserRole, User } from './api'

/**
 * Register (authenticated user creates another account)
 */
export interface RegisterRequestDto {
  username: string
  password: string
  role: UserRole
  isActive?: boolean
}

export interface RegisterResponseDto {
  success: boolean
  message?: string
  error?: string
  details?: string[]
  user?: User
}

/**
 * Login
 */
export interface LoginRequestDto {
  username: string
  password: string
  remember?: boolean
}

export interface LoginResponseDto {
  success: boolean
  message?: string
  error?: string
  user?: {
    id: string
    username: string
    role: UserRole
  }
  expiresAt?: string
  accessExpiresAt?: string
  refreshExpiresAt?: string
}

/**
 * Logout
 */
export interface LogoutResponseDto {
  success: boolean
  message?: string
  error?: string
}

/**
 * Current User (Me)
 */
export interface MeResponseDto {
  success: boolean
  user?: {
    id: string
    username: string
    role: UserRole
  }
  error?: string
}

/**
 * Refresh Token
 */
export interface RefreshResponseDto {
  success: boolean
  message?: string
  error?: string
  user?: {
    id: string
    username: string
    role: UserRole
  }
  accessExpiresAt?: string
  refreshExpiresAt?: string
}
