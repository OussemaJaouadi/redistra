import type { UserRole } from '@/types'
import { authPlugin } from './auth'

/**
 * Role-based access control plugins
 */

/**
 * Require authentication (any role)
 */
export const requireAuth = () => authPlugin()

/**
 * Require specific role (hierarchical: viewer < editor < admin)
 */
export const requireRole = (role: UserRole) => authPlugin({ requiredRole: role })

/**
 * Require one of the specified roles (non-hierarchical)
 */
export const requireRoles = (roles: UserRole[]) => authPlugin({ requiredRoles: roles })

