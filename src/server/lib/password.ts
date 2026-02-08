import { env } from '@/env'
import bcrypt from 'bcryptjs'

/**
 * Password validation utilities
 */

export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate password complexity based on environment settings
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < env.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${env.PASSWORD_MIN_LENGTH} characters`)
  }

  if (env.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (env.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (env.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (env.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}
