/**
 * Settings Controllers
 * Handles system settings operations
 */

import { db } from '@/db'
import { systemSettings } from '@/db/schema/settings'
import { eq, desc } from 'drizzle-orm'
import { logAudit } from '@/server/lib/audit'
import type {
  ListSystemSettingsResponseDto,
  GetSystemSettingResponseDto,
  UpdateSystemSettingRequestDto,
  UpdateSystemSettingResponseDto,
  GetPublicSettingsResponseDto,
  SystemSetting,
  DefaultSystemSettings
} from '@/types'

/**
 * Default system settings
 */
const DEFAULT_SETTINGS: DefaultSystemSettings = {
  // Security settings
  'password.minLength': 8,
  'password.requireUppercase': true,
  'password.requireLowercase': true,
  'password.requireNumber': true,
  'password.requireSpecial': true,
  'login.lockoutAttempts': 5,
  'login.lockoutDuration': 15, // minutes
  'session.maxAge': 24, // hours
  'session.rememberMaxAge': 30, // days

  // Audit settings
  'audit.retentionDays': 90,
  'audit.enableExport': true,

  // Redis settings
  'redis.scanCount': 100,
  'redis.maxKeyPageSize': 1000,
  'redis.connectionTimeout': 5000, // milliseconds

  // Application settings
  'app.name': 'RediStra',
  'app.allowSignup': false,
  'app.maintenanceMode': false
}

/**
 * Setting categories and their public visibility
 */
const SETTING_CATEGORIES = {
  'password.minLength': { category: 'security', isPublic: false },
  'password.requireUppercase': { category: 'security', isPublic: false },
  'password.requireLowercase': { category: 'security', isPublic: false },
  'password.requireNumber': { category: 'security', isPublic: false },
  'password.requireSpecial': { category: 'security', isPublic: false },
  'login.lockoutAttempts': { category: 'security', isPublic: false },
  'login.lockoutDuration': { category: 'security', isPublic: false },
  'session.maxAge': { category: 'security', isPublic: false },
  'session.rememberMaxAge': { category: 'security', isPublic: false },
  'audit.retentionDays': { category: 'audit', isPublic: false },
  'audit.enableExport': { category: 'audit', isPublic: true },
  'redis.scanCount': { category: 'redis', isPublic: false },
  'redis.maxKeyPageSize': { category: 'redis', isPublic: false },
  'redis.connectionTimeout': { category: 'redis', isPublic: false },
  'app.name': { category: 'app', isPublic: true },
  'app.allowSignup': { category: 'app', isPublic: true },
  'app.maintenanceMode': { category: 'app', isPublic: true }
} as const

/**
 * List all system settings (admin only)
 */
export async function listSettings(): Promise<ListSystemSettingsResponseDto> {
  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .orderBy(desc(systemSettings.updatedAt))

    return {
      success: true,
      settings
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list settings'
    }
  }
}

/**
 * Get a specific system setting
 */
export async function getSetting(
  key: string,
  userId?: string,
  userRole?: string
): Promise<GetSystemSettingResponseDto> {
  try {
    const setting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1)
      .then(rows => rows[0])

    if (!setting) {
      // Return default setting if not found
      const defaultValue = DEFAULT_SETTINGS[key as keyof DefaultSystemSettings]
      if (defaultValue !== undefined) {
        const categoryInfo = SETTING_CATEGORIES[key as keyof typeof SETTING_CATEGORIES]

        // Check if user has access to this setting
        if (userRole !== 'admin' && !categoryInfo?.isPublic) {
          return {
            success: false,
            error: 'Setting not found or access denied'
          }
        }

        return {
          success: true,
          value: defaultValue
        }
      }

      return {
        success: false,
        error: 'Setting not found'
      }
    }

    // Check if user has access to this setting
    if (userRole !== 'admin' && !setting.isPublic) {
      return {
        success: false,
        error: 'Access denied'
      }
    }

    let parsedValue: unknown
    try {
      parsedValue = JSON.parse(setting.value)
    } catch {
      parsedValue = setting.value
    }

    return {
      success: true,
      setting,
      value: parsedValue
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get setting'
    }
  }
}

/**
 * Update a system setting (admin only)
 */
export async function updateSetting(
  key: string,
  data: UpdateSystemSettingRequestDto,
  userId: string,
  ipAddress: string,
  userAgent?: string
): Promise<UpdateSystemSettingResponseDto> {
  try {
    // Validate setting exists and get category info
    const categoryInfo = SETTING_CATEGORIES[key as keyof typeof SETTING_CATEGORIES]
    if (!categoryInfo) {
      return {
        success: false,
        error: 'Unknown setting key'
      }
    }

    // Validate value type and range
    const validationError = validateSettingValue(key, data.value)
    if (validationError) {
      return {
        success: false,
        error: validationError
      }
    }

    // Serialize value
    const serializedValue = typeof data.value === 'string' ? data.value : JSON.stringify(data.value)

    // Update or create setting
    const existingSetting = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1)
      .then(rows => rows[0])

    let updatedSetting: SystemSetting

    if (existingSetting) {
      // Update existing setting
      await db
        .update(systemSettings)
        .set({
          value: serializedValue,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.key, key))

      updatedSetting = {
        ...existingSetting,
        value: serializedValue,
        updatedAt: new Date()
      }
    } else {
      // Create new setting
      const newSetting = {
        key,
        value: serializedValue,
        category: categoryInfo.category,
        isPublic: categoryInfo.isPublic
      }

      await db.insert(systemSettings).values(newSetting)
      updatedSetting = {
        id: crypto.randomUUID(),
        ...newSetting,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    // Log audit event
    await logAudit({
      userId,
      action: 'setting.updated',
      resourceType: 'setting',
      resourceId: key,
      resourceName: key,
      details: JSON.stringify({ oldValue: existingSetting?.value, newValue: serializedValue }),
      ipAddress,
      userAgent
    })

    return {
      success: true,
      setting: updatedSetting,
      message: `Setting '${key}' updated successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update setting'
    }
  }
}

/**
 * Get public settings (readable by all users)
 */
export async function getPublicSettings(): Promise<GetPublicSettingsResponseDto> {
  try {
    const publicSettings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.isPublic, true))

    // Convert to key-value pairs
    const settingsMap: Record<string, unknown> = {}

    // Add database public settings
    publicSettings.forEach(setting => {
      try {
        settingsMap[setting.key] = JSON.parse(setting.value)
      } catch {
        settingsMap[setting.key] = setting.value
      }
    })

    // Add default public settings that aren't in database
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
      const categoryInfo = SETTING_CATEGORIES[key as keyof typeof SETTING_CATEGORIES]
      if (categoryInfo?.isPublic && !(key in settingsMap)) {
        settingsMap[key] = value
      }
    })

    return {
      success: true,
      settings: settingsMap
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get public settings'
    }
  }
}

/**
 * Reset all settings to defaults (admin only)
 */
export async function resetSettings(
  userId: string,
  ipAddress: string,
  userAgent?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Delete all settings from database
    await db.delete(systemSettings)

    // Log audit event
    await logAudit({
      userId,
      action: 'settings.reset',
      resourceType: 'settings',
      resourceId: 'all',
      resourceName: 'All Settings',
      details: JSON.stringify({ action: 'reset_to_defaults' }),
      ipAddress,
      userAgent
    })

    return {
      success: true,
      message: 'All settings have been reset to defaults'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset settings'
    }
  }
}

/**
 * Validate setting value based on key and type
 */
function validateSettingValue(key: string, value: unknown): string | null {
  const categoryInfo = SETTING_CATEGORIES[key as keyof typeof SETTING_CATEGORIES]
  if (!categoryInfo) {
    return 'Unknown setting key'
  }

  // Type validation based on setting key
  switch (key) {
    case 'password.minLength':
    case 'login.lockoutAttempts':
    case 'login.lockoutDuration':
    case 'session.maxAge':
    case 'session.rememberMaxAge':
    case 'audit.retentionDays':
    case 'redis.scanCount':
    case 'redis.maxKeyPageSize':
    case 'redis.connectionTimeout':
      if (typeof value !== 'number' || value < 0) {
        return 'Value must be a positive number'
      }
      break

    case 'password.requireUppercase':
    case 'password.requireLowercase':
    case 'password.requireNumber':
    case 'password.requireSpecial':
    case 'audit.enableExport':
    case 'app.allowSignup':
    case 'app.maintenanceMode':
      if (typeof value !== 'boolean') {
        return 'Value must be a boolean'
      }
      break

    case 'app.name':
      if (typeof value !== 'string' || value.length === 0 || value.length > 100) {
        return 'Value must be a string between 1 and 100 characters'
      }
      break

    default:
      // For unknown settings, just ensure it's not null/undefined
      if (value === null || value === undefined) {
        return 'Value cannot be null or undefined'
      }
  }

  return null
}
