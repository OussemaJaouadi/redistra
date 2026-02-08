import { Elysia } from 'elysia'
import { authRoutes } from './auth'
import { usersRoutes } from './users'
import { connectionsRoutes } from './connections'
import { redisRoutes } from './redis'
import { auditRoutes } from './audit'
import { settingsRoutes, publicSettingsRoutes } from './settings'
import { preferencesRoutes } from './preferences'
import { healthRoutes } from './health'
import { exportRoutes } from './export'

/**
 * Main routes entry point
 * Combines all route modules
 */
export const routes = new Elysia()
  .use(authRoutes)
  .use(usersRoutes)
  .use(connectionsRoutes)
  .use(redisRoutes)
  .use(auditRoutes)
  .use(settingsRoutes)
  .use(publicSettingsRoutes)
  .use(preferencesRoutes)
  .use(healthRoutes)
  .use(exportRoutes)
