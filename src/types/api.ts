/**
 * Shared API types for frontend and backend
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  details?: string | string[]
  data?: T
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * User roles
 */
export type UserRole = 'admin' | 'editor' | 'viewer'

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string // User ID
  username: string
  role: UserRole
  sid?: string // Session ID
  iat?: number // Issued at
  exp?: number // Expiration
}

/**
 * User context after authentication (used in backend plugins/routes)
 */
export interface AuthUser {
  id: string
  username: string
  role: UserRole
}

/**
 * Auth plugin options
 */
export interface AuthPluginOptions {
  requiredRole?: UserRole
  requiredRoles?: UserRole[] // Allow multiple roles
}

/**
 * User entity
 */
export interface User {
  id: string
  username: string
  role: UserRole
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Session info
 */
export interface SessionInfo {
  user: AuthUser
  expiresAt: string
}
