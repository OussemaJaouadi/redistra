
/**
 * @deprecated Use server-side authentication instead
 * 
 * ⚠️ THIS FILE IS DEPRECATED - DO NOT USE CLIENT-SIDE GUARDS ⚠️
 * 
 * Client-side guards are insecure and lose Next.js SSR benefits.
 * 
 * ✅ CORRECT APPROACH:
 * 1. Route protection: Use middleware.ts (already configured)
 * 2. Server components: Use requireAuth() from @/lib/auth/server
 * 3. Client components: Use useMe() for UI state only (not protection)
 * 
 * Example (Server Component):
 * ```tsx
 * import { requireAuth } from '@/lib/auth/server'
 * 
 * export default async function ProtectedPage() {
 *   const user = await requireAuth()
 *   return <div>Welcome {user.username}</div>
 * }
 * ```
 * 
 * Example (Client Component - UI state only):
 * ```tsx
 * "use client"
 * import { useMe } from '@/lib/api'
 * 
 * export function UserMenu() {
 *   const { data } = useMe()
 *   // User is already authenticated via middleware
 *   return <div>{data?.data?.user?.username}</div>
 * }
 * ```
 */

import { useMe } from '@/lib/api'

/**
 * @deprecated Use middleware.ts and requireAuth() instead
 * Client-side hook for UI state only - NOT for route protection
 */
export function useAuthState() {
  const { data: userData, isLoading } = useMe()
  
  return {
    isAuthenticated: !!userData?.data?.user,
    isLoading,
    user: userData?.data?.user,
  }
}