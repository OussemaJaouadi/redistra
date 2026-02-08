/**
 * Preferences Controllers
 * Handles user preferences operations
 */

import { db } from '@/db'
import { userPreferences } from '@/db/schema/settings'
import { eq, desc, and } from 'drizzle-orm'
import { logAudit } from '@/server/lib/audit'
import type {
  ListUserPreferencesResponseDto,
  UpdateUserPreferenceRequestDto,
  UpdateUserPreferenceResponseDto,
  UserPreference,
  DefaultUserPreferences
} from '@/types'

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: DefaultUserPreferences = {
  // UI preferences
  'theme': 'auto',
  'language': 'en',
  'defaultPageSize': 25,

  // Redis preferences
  'defaultDatabase': 0,
  'keyValueDisplay': 'formatted',
  'autoRefresh': false,
  'autoRefreshInterval': 10,

  // Editor preferences
  'editorTheme': 'vs-dark',
  'editorFontSize': 14,
  'editorTabSize': 2
}

/**
 * Get all user preferences
 */
export async function getUserPreferences(
  userId: string
): Promise<ListUserPreferencesResponseDto> {
  try {
    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .orderBy(desc(userPreferences.updatedAt))

    // Convert to key-value pairs
    const preferencesMap: Record<string, unknown> = {}

    // Add database preferences
    preferences.forEach(pref => {
      try {
        preferencesMap[pref.key] = JSON.parse(pref.value)
      } catch {
        preferencesMap[pref.key] = pref.value
      }
    })

    // Add default preferences that aren't in database
    Object.entries(DEFAULT_PREFERENCES).forEach(([key, value]) => {
      if (!(key in preferencesMap)) {
        preferencesMap[key] = value
      }
    })

    return {
      success: true,
      preferences,
      values: preferencesMap
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user preferences'
    }
  }
}

/**
 * Update a user preference
 */
export async function updatePreference(
  userId: string,
  key: string,
  data: UpdateUserPreferenceRequestDto,
  ipAddress: string,
  userAgent?: string
): Promise<UpdateUserPreferenceResponseDto> {
  try {
    // Validate preference key
    const defaultValue = DEFAULT_PREFERENCES[key as keyof DefaultUserPreferences]
    if (defaultValue === undefined) {
      return {
        success: false,
        error: 'Unknown preference key'
      }
    }

    // Validate value type and range
    const validationError = validatePreferenceValue(key, data.value)
    if (validationError) {
      return {
        success: false,
        error: validationError
      }
    }

    // Serialize value
    const serializedValue = typeof data.value === 'string' ? data.value : JSON.stringify(data.value)

    // Update or create preference
    const existingPreferenceResults = await db
      .select()
      .from(userPreferences)
      .where(and(eq(userPreferences.userId, userId), eq(userPreferences.key, key)))
      .limit(1)

    const existingPreference = existingPreferenceResults[0]

    let updatedPreference: UserPreference

    if (existingPreference) {
      // Update existing preference
      await db
        .update(userPreferences)
        .set({
          value: serializedValue,
          updatedAt: new Date()
        })
        .where(and(eq(userPreferences.userId, userId), eq(userPreferences.key, key)))

      updatedPreference = {
        id: existingPreference.id,
        userId: existingPreference.userId,
        key: existingPreference.key,
        value: serializedValue,
        createdAt: existingPreference.createdAt,
        updatedAt: new Date()
      }
    } else {
      // Create new preference
      const newPreference = {
        userId,
        key,
        value: serializedValue
      }

      await db.insert(userPreferences).values(newPreference)
      updatedPreference = {
        id: crypto.randomUUID(),
        ...newPreference,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    // Log audit event
    await logAudit({
      userId,
      action: 'preference.updated',
      resourceType: 'preference',
      resourceId: key,
      resourceName: `${userId}:${key}`,
      details: JSON.stringify({ oldValue: existingPreference?.value, newValue: serializedValue }),
      ipAddress,
      userAgent
    })

    return {
      success: true,
      preference: updatedPreference,
      message: `Preference '${key}' updated successfully`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preference'
    }
  }
}

/**
 * Validate preference value based on key and type
 */
function validatePreferenceValue(key: string, value: unknown): string | null {
  // Type validation based on preference key
  switch (key) {
    case 'defaultPageSize':
    case 'defaultDatabase':
    case 'autoRefreshInterval':
    case 'editorFontSize':
    case 'editorTabSize':
      if (typeof value !== 'number' || value < 0) {
        return 'Value must be a positive number'
      }
      break

    case 'theme':
      if (typeof value !== 'string' || !['light', 'dark', 'auto'].includes(value)) {
        return 'Theme must be one of: light, dark, auto'
      }
      break

    case 'language':
      if (typeof value !== 'string' || value.length < 2 || value.length > 10) {
        return 'Language must be a string between 2 and 10 characters'
      }
      break

    case 'keyValueDisplay':
      if (typeof value !== 'string' || !['raw', 'formatted', 'hex'].includes(value)) {
        return 'Key value display must be one of: raw, formatted, hex'
      }
      break

    case 'autoRefresh':
      if (typeof value !== 'boolean') {
        return 'Value must be a boolean'
      }
      break

    case 'editorTheme':
      if (typeof value !== 'string' || !['vs-dark', 'vs-light'].includes(value)) {
        return 'Editor theme must be one of: vs-dark, vs-light'
      }
      break

    default:
      // For unknown preferences, just ensure it's not null/undefined
      if (value === null || value === undefined) {
        return 'Value cannot be null or undefined'
      }
  }

  return null
}

/**
 * Reset all user preferences to defaults
 */
export async function resetPreferences(
  userId: string,
  ipAddress: string,
  userAgent?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Delete all user preferences from database
    await db.delete(userPreferences).where(eq(userPreferences.userId, userId))

    // Log audit event
    await logAudit({
      userId,
      action: 'preferences.reset',
      resourceType: 'preferences',
      resourceId: 'all',
      resourceName: 'All Preferences',
      details: JSON.stringify({ action: 'reset_to_defaults' }),
      ipAddress,
      userAgent
    })

    return {
      success: true,
      message: 'All preferences have been reset to defaults'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset preferences'
    }
  }
}
