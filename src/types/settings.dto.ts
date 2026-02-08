/**
 * Settings & Preferences DTOs
 */


/**
 * System setting
 */
export interface SystemSetting {
  id: string
  key: string
  value: string // JSON string for complex values
  category: string // e.g., 'security', 'audit', 'redis', 'app'
  isPublic: boolean // Readable by non-admin users
  createdAt: Date
  updatedAt: Date
}

/**
 * User preference
 */
export interface UserPreference {
  id: string
  userId: string
  key: string
  value: string // JSON string for complex values
  createdAt: Date
  updatedAt: Date
}

/**
 * List System Settings Response
 */
export type ListSystemSettingsResponseDto = {
  success: boolean
  settings?: SystemSetting[]
  error?: string
}

/**
 * Get System Setting Response
 */
export type GetSystemSettingResponseDto = {
  success: boolean
  setting?: SystemSetting
  value?: unknown // Parsed JSON value
  error?: string
}

/**
 * Update System Setting Request
 */
export interface UpdateSystemSettingRequestDto {
  value: unknown // Can be string, number, boolean, object, etc.
}

export type UpdateSystemSettingResponseDto = {
  success: boolean
  setting?: SystemSetting
  message?: string
  error?: string
}

/**
 * Get Public Settings Response
 */
export type GetPublicSettingsResponseDto = {
  success: boolean
  settings?: Record<string, unknown> // Key-value pairs of public settings
  error?: string
}

/**
 * List User Preferences Response
 */
export type ListUserPreferencesResponseDto = {
  success: boolean
  preferences?: UserPreference[]
  values?: Record<string, unknown> // Key-value pairs
  error?: string
}

/**
 * Update User Preference Request
 */
export interface UpdateUserPreferenceRequestDto {
  value: unknown // Can be string, number, boolean, object, etc.
}

export type UpdateUserPreferenceResponseDto = {
  success: boolean
  preference?: UserPreference
  message?: string
  error?: string
}

/**
 * Setting categories
 */
export type SettingCategory = 'security' | 'audit' | 'redis' | 'app'

/**
 * Default system settings
 */
export interface DefaultSystemSettings {
  // Security settings
  'password.minLength': number
  'password.requireUppercase': boolean
  'password.requireLowercase': boolean
  'password.requireNumber': boolean
  'password.requireSpecial': boolean
  'login.lockoutAttempts': number
  'login.lockoutDuration': number // minutes
  'session.maxAge': number // hours
  'session.rememberMaxAge': number // days

  // Audit settings
  'audit.retentionDays': number
  'audit.enableExport': boolean

  // Redis settings
  'redis.scanCount': number
  'redis.maxKeyPageSize': number
  'redis.connectionTimeout': number // milliseconds

  // Application settings
  'app.name': string
  'app.allowSignup': boolean
  'app.maintenanceMode': boolean
}

/**
 * Default user preferences
 */
export interface DefaultUserPreferences {
  // UI preferences
  'theme': 'light' | 'dark' | 'auto'
  'language': string
  'defaultPageSize': number

  // Redis preferences
  'defaultDatabase': number
  'keyValueDisplay': 'raw' | 'formatted' | 'hex'
  'autoRefresh': boolean
  'autoRefreshInterval': number // seconds

  // Editor preferences
  'editorTheme': 'vs-dark' | 'vs-light'
  'editorFontSize': number
  'editorTabSize': number
}
