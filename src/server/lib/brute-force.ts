/**
 * Brute Force Protection
 * Tracks failed login attempts and implements rate limiting
 */

import { env } from '@/env'

// In-memory storage for failed attempts
// In production, this should be stored in Redis or database
interface FailedAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
  lockedUntil?: number
}

const attempts = new Map<string, FailedAttempt>()

// Configuration from environment variables with defaults
const MAX_ATTEMPTS = env.BRUTE_FORCE_MAX_ATTEMPTS
const LOCKOUT_DURATION_MS = env.BRUTE_FORCE_LOCKOUT_MINUTES * 60 * 1000
const ATTEMPT_WINDOW_MS = env.BRUTE_FORCE_WINDOW_MINUTES * 60 * 1000

/**
 * Get the key for tracking attempts (combines IP and username)
 */
function getAttemptKey(ipAddress: string, username: string): string {
  return `${ipAddress}:${username.toLowerCase()}`
}

/**
 * Check if an account is currently locked
 */
export function isAccountLocked(ipAddress: string, username: string): { locked: boolean; remainingTime?: number } {
  const key = getAttemptKey(ipAddress, username)
  const attempt = attempts.get(key)
  
  if (!attempt) {
    return { locked: false }
  }
  
  const now = Date.now()
  
  // Check if lockout has expired
  if (attempt.lockedUntil) {
    if (now < attempt.lockedUntil) {
      const remainingTime = Math.ceil((attempt.lockedUntil - now) / 1000)
      return { locked: true, remainingTime }
    } else {
      // Lockout expired, reset the attempt
      attempts.delete(key)
      return { locked: false }
    }
  }
  
  return { locked: false }
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ipAddress: string, username: string): { locked: boolean; remainingTime?: number } {
  const key = getAttemptKey(ipAddress, username)
  const now = Date.now()
  
  let attempt = attempts.get(key)
  
  if (!attempt) {
    attempt = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now
    }
  }
  
  // Reset if outside the attempt window
  if (now - attempt.firstAttempt > ATTEMPT_WINDOW_MS) {
    attempt = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now
    }
  }
  
  attempt.count++
  attempt.lastAttempt = now
  
  // Check if we should lock the account
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION_MS
    attempts.set(key, attempt)
    return { 
      locked: true, 
      remainingTime: Math.ceil(LOCKOUT_DURATION_MS / 1000)
    }
  }
  
  attempts.set(key, attempt)
  return { locked: false }
}

/**
 * Clear failed attempts after successful login
 */
export function clearFailedAttempts(ipAddress: string, username: string): void {
  const key = getAttemptKey(ipAddress, username)
  attempts.delete(key)
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(ipAddress: string, username: string): number {
  const key = getAttemptKey(ipAddress, username)
  const attempt = attempts.get(key)
  
  if (!attempt) {
    return MAX_ATTEMPTS
  }
  
  const now = Date.now()
  
  // Reset if outside the attempt window
  if (now - attempt.firstAttempt > ATTEMPT_WINDOW_MS) {
    return MAX_ATTEMPTS
  }
  
  return Math.max(0, MAX_ATTEMPTS - attempt.count)
}

/**
 * Clean up old entries (should be called periodically)
 */
export function cleanupOldAttempts(): void {
  const now = Date.now()
  
  for (const [key, attempt] of attempts.entries()) {
    // Remove entries outside the attempt window and not locked
    if (!attempt.lockedUntil && now - attempt.firstAttempt > ATTEMPT_WINDOW_MS) {
      attempts.delete(key)
    }
    // Remove expired lockouts
    else if (attempt.lockedUntil && now > attempt.lockedUntil) {
      attempts.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldAttempts, 5 * 60 * 1000)
