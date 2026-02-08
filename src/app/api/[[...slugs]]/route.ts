import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { routes } from '@/server/routes'
import { ensureBootstrap } from '@/server/lib/bootstrap'

/**
 * Main Elysia app integrated into Next.js App Router
 * All API routes are handled through this single endpoint
 */
const app = new Elysia({ prefix: '/api' })
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'RediStra API Documentation',
        version: '1.0.0',
      },
    },
  }))
  .use(routes)
  .onError(({ code, error, set }) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('API Error:', { code, error: errorMessage })

    if (code === 'VALIDATION') {
      set.status = 400
      return {
        success: false,
        error: 'Validation error',
        details: errorMessage,
      }
    }

    if (code === 'NOT_FOUND') {
      set.status = 404
      return {
        success: false,
        error: 'Not found',
      }
    }

    // Handle thrown errors from auth plugin
    if (errorMessage.includes('Unauthorized')) {
      set.status = 401
      return {
        success: false,
        error: errorMessage.replace('Error: ', ''),
      }
    }

    if (errorMessage.includes('Forbidden')) {
      set.status = 403
      return {
        success: false,
        error: errorMessage.replace('Error: ', ''),
      }
    }

    set.status = 500
    return {
      success: false,
      error: 'Internal server error',
    }
  })

const handler = async (request: Request) => {
  await ensureBootstrap()
  return app.handle(request)
}

// Export HTTP method handlers for Next.js App Router
export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
export const OPTIONS = handler
