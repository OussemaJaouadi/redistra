// Environment configuration with proper type safety
import { config } from 'dotenv'

// Load .env file only in development
if (process.env.NODE_ENV !== 'production') {
  process.env.DOTENV_CONFIG_QUIET = 'true'
  config({ path: '.env' })
}

function getEnvString(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key]
  
  if (!value && required) {
    throw new Error(`Environment variable ${key} is required`)
  }
  
  return value || defaultValue || ''
}

function getEnvNumber(key: string, defaultValue: number, min?: number, max?: number): number {
  const value = process.env[key]
  
  if (!value) return defaultValue
  
  const parsed = Number(value)
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`)
  }
  
  if (min !== undefined && parsed < min) {
    throw new Error(`Environment variable ${key} must be at least ${min}, got: ${parsed}`)
  }
  
  if (max !== undefined && parsed > max) {
    throw new Error(`Environment variable ${key} must be at most ${max}, got: ${parsed}`)
  }
  
  return parsed
}

function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key]
  
  if (!value) return defaultValue
  
  return value === 'true'
}

function validateMinLength(key: string, value: string, minLength: number): void {
  if (value.length < minLength) {
    throw new Error(`Environment variable ${key} must be at least ${minLength} characters, got: ${value.length}`)
  }
}

// Parse and validate environment variables with proper types
const NODE_ENV = getEnvString('NODE_ENV', 'development') as 'development' | 'production' | 'test'
const PORT = getEnvNumber('PORT', 3000)
const JWT_SECRET = getEnvString('JWT_SECRET', '', true)
const ENCRYPTION_KEY = getEnvString('ENCRYPTION_KEY', '', true)
const DATABASE_URL = getEnvString('DATABASE_URL', './data/redis-ui.db')
const ADMIN_USERNAME = getEnvString('ADMIN_USERNAME')
const ADMIN_PASSWORD = getEnvString('ADMIN_PASSWORD')

// Validate secret lengths
validateMinLength('JWT_SECRET', JWT_SECRET, 32)
validateMinLength('ENCRYPTION_KEY', ENCRYPTION_KEY, 32)

// Export typed environment configuration
export const env = {
  NODE_ENV,
  PORT,
  JWT_SECRET,
  ENCRYPTION_KEY,
  DATABASE_URL,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  
  // Security settings
  LOGIN_LOCKOUT_ATTEMPTS: getEnvNumber('LOGIN_LOCKOUT_ATTEMPTS', 5, 1, 20),
  LOGIN_LOCKOUT_DURATION_MINUTES: getEnvNumber('LOGIN_LOCKOUT_DURATION_MINUTES', 15, 1, 1440),
  
  // Brute force protection
  BRUTE_FORCE_MAX_ATTEMPTS: getEnvNumber('BRUTE_FORCE_MAX_ATTEMPTS', 5, 1, 100),
  BRUTE_FORCE_LOCKOUT_MINUTES: getEnvNumber('BRUTE_FORCE_LOCKOUT_MINUTES', 15, 1, 1440),
  BRUTE_FORCE_WINDOW_MINUTES: getEnvNumber('BRUTE_FORCE_WINDOW_MINUTES', 60, 1, 1440),
  ACCESS_TOKEN_TTL_MINUTES: getEnvNumber('ACCESS_TOKEN_TTL_MINUTES', 15, 1, 1440),
  SESSION_TTL_DAYS: getEnvNumber('SESSION_TTL_DAYS', 1, 1, 365),
  REMEMBER_ME_TTL_DAYS: getEnvNumber('REMEMBER_ME_TTL_DAYS', 30, 1, 365),

  // Logging
  DB_LOGGING: getEnvBoolean('DB_LOGGING', false),
  
  // Password requirements
  PASSWORD_MIN_LENGTH: getEnvNumber('PASSWORD_MIN_LENGTH', 8, 6, 128),
  PASSWORD_REQUIRE_UPPERCASE: getEnvBoolean('PASSWORD_REQUIRE_UPPERCASE', true),
  PASSWORD_REQUIRE_LOWERCASE: getEnvBoolean('PASSWORD_REQUIRE_LOWERCASE', true),
  PASSWORD_REQUIRE_NUMBER: getEnvBoolean('PASSWORD_REQUIRE_NUMBER', true),
  PASSWORD_REQUIRE_SPECIAL: getEnvBoolean('PASSWORD_REQUIRE_SPECIAL', true),
} as const

// Export type
export type Env = typeof env
