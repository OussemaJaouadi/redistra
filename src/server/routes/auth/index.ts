import { Elysia } from 'elysia'
import { registerRoutes } from './register'
import { loginRoutes } from './login'
import { logoutRoutes } from './logout'
import { meRoutes } from './me'
import { refreshRoutes } from './refresh'

/**
 * Combined auth routes
 */
export const authRoutes = new Elysia()
  .use(registerRoutes)
  .use(loginRoutes)
  .use(refreshRoutes)
  .use(logoutRoutes)
  .use(meRoutes)
