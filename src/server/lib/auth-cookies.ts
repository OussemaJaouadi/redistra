import { env } from '@/env'

export const ACCESS_TOKEN_COOKIE = 'rds_access_token'
export const REFRESH_TOKEN_COOKIE = 'rds_refresh_token'

export const LEGACY_ACCESS_TOKEN_COOKIE = 'access_token'
export const LEGACY_REFRESH_TOKEN_COOKIE = 'refresh_token'
export const LEGACY_TOKEN_COOKIE = 'token'

export function buildAuthCookie(
  name: string,
  value: string,
  maxAgeSeconds: number
): string {
  return [
    `${name}=${value}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}

export function clearAuthCookie(name: string): string {
  return [
    `${name}=`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0',
    env.NODE_ENV === 'production' ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')
}
