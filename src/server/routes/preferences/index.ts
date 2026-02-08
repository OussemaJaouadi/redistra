/**
 * Preferences Routes
 * HTTP handlers for user preferences operations
 */

import { Elysia, t } from 'elysia'
import { requireAuth } from '@/server/plugins/roles'
import { getClientIP, getUserAgent } from '@/server/lib/audit'
import {
  getUserPreferences,
  updatePreference
} from '@/server/controllers/preferences'
import {
  updateUserPreferenceSchema
} from '@/types'
import type {
  ListUserPreferencesResponseDto,
  UpdateUserPreferenceRequestDto,
  UpdateUserPreferenceResponseDto
} from '@/types'

/**
 * Preferences routes - require authentication
 */
export const preferencesRoutes = new Elysia({ prefix: '/preferences' })
  .use(requireAuth())

  /**
   * Get user preferences
   * GET /api/preferences
   */
  .get(
    '/',
    async ({ user, set }) => {
      try {
        const result = await getUserPreferences(user!.id)
        
        return result as ListUserPreferencesResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get user preferences'
        } as ListUserPreferencesResponseDto
      }
    }
  )

  /**
   * Update user preference
   * PUT /api/preferences/:key
   */
  .put(
    '/:key',
    async ({ params, body, user, request, set }) => {
      try {
        const ipAddress = getClientIP(request)
        const userAgent = getUserAgent(request)
        
        const result = await updatePreference(
          user!.id,
          params.key,
          body as UpdateUserPreferenceRequestDto,
          ipAddress,
          userAgent
        )
        
        return result as UpdateUserPreferenceResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update preference'
        } as UpdateUserPreferenceResponseDto
      }
    },
    {
      params: t.Object({
        key: t.String()
      }),
      body: updateUserPreferenceSchema
    }
  )

  /**
   * Reset all user preferences to defaults
   * POST /api/preferences/reset
   */
  .post(
    '/reset',
    async ({ user, request, set }) => {
      try {
        const ipAddress = getClientIP(request)
        const userAgent = getUserAgent(request)
        
        // Import reset function
        const { resetPreferences } = await import('@/server/controllers/preferences')
        
        const result = await resetPreferences(user!.id, ipAddress, userAgent)
        
        return result
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to reset preferences'
        }
      }
    }
  )
