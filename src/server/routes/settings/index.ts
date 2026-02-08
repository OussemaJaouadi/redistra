/**
 * Settings Routes
 * HTTP handlers for system settings operations
 */

import { Elysia, t } from 'elysia'
import { requireRole } from '@/server/plugins/roles'
import { getClientIP, getUserAgent } from '@/server/lib/audit'
import {
  listSettings,
  getSetting,
  updateSetting,
  getPublicSettings
} from '@/server/controllers/settings'
import {
  updateSystemSettingSchema
} from '@/types'
import type {
  ListSystemSettingsResponseDto,
  GetSystemSettingResponseDto,
  UpdateSystemSettingRequestDto,
  UpdateSystemSettingResponseDto,
  GetPublicSettingsResponseDto
} from '@/types'

/**
 * Settings routes - admin only access for most operations
 */
export const settingsRoutes = new Elysia({ prefix: '/settings' })
  .use(requireRole('admin'))

  /**
   * List all system settings
   * GET /api/settings
   */
  .get(
    '/',
    async ({ set }) => {
      try {
        const result = await listSettings()
        
        return result as ListSystemSettingsResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list settings'
        } as ListSystemSettingsResponseDto
      }
    }
  )

  /**
   * Get specific system setting
   * GET /api/settings/:key
   */
  .get(
    '/:key',
    async ({ params, user, set }) => {
      try {
        const result = await getSetting(
          params.key,
          user!.id,
          user!.role
        )
        
        return result as GetSystemSettingResponseDto
      } catch (error) {
        set.status = 404
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get setting'
        } as GetSystemSettingResponseDto
      }
    },
    {
      params: t.Object({
        key: t.String()
      })
    }
  )

  /**
   * Update system setting
   * PUT /api/settings/:key
   */
  .put(
    '/:key',
    async ({ params, body, user, request, set }) => {
      try {
        const ipAddress = getClientIP(request)
        const userAgent = getUserAgent(request)
        
        const result = await updateSetting(
          params.key,
          body as UpdateSystemSettingRequestDto,
          user!.id,
          ipAddress,
          userAgent
        )
        
        return result as UpdateSystemSettingResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update setting'
        } as UpdateSystemSettingResponseDto
      }
    },
    {
      params: t.Object({
        key: t.String()
      }),
      body: updateSystemSettingSchema
    }
  )

  /**
   * Reset all settings to defaults
   * POST /api/settings/reset
   */
  .post(
    '/reset',
    async ({ user, request, set }) => {
      try {
        const ipAddress = getClientIP(request)
        const userAgent = getUserAgent(request)
        
        // Import reset function
        const { resetSettings } = await import('@/server/controllers/settings')
        
        const result = await resetSettings(user!.id, ipAddress, userAgent)
        
        return result
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to reset settings'
        }
      }
    }
  )

/**
 * Public settings route - accessible by all authenticated users
 */
export const publicSettingsRoutes = new Elysia({ prefix: '/settings' })
  .get(
    '/public',
    async ({ set }) => {
      try {
        const result = await getPublicSettings()
        
        return result as GetPublicSettingsResponseDto
      } catch (error) {
        set.status = 500
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get public settings'
        } as GetPublicSettingsResponseDto
      }
    }
  )
