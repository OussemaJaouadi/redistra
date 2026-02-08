/**
 * Settings & Preferences Validation Schemas
 */

import { t } from 'elysia'

/**
 * Update System Setting Schema
 */
export const updateSystemSettingSchema = t.Object({
  value: t.Any({
    error: 'Value is required'
  })
})

/**
 * Update User Preference Schema
 */
export const updateUserPreferenceSchema = t.Object({
  value: t.Any({
    error: 'Value is required'
  })
})

/**
 * Response schemas for settings operations
 */
export const systemSettingSchema = t.Object({
  id: t.String(),
  key: t.String(),
  value: t.String(),
  category: t.String(),
  isPublic: t.Boolean(),
  createdAt: t.String(),
  updatedAt: t.String()
})

export const userPreferenceSchema = t.Object({
  id: t.String(),
  userId: t.String(),
  key: t.String(),
  value: t.String(),
  createdAt: t.String(),
  updatedAt: t.String()
})

export const listSystemSettingsResponseSchema = t.Object({
  success: t.Boolean(),
  settings: t.Optional(t.Array(systemSettingSchema)),
  error: t.Optional(t.String())
})

export const getSystemSettingResponseSchema = t.Object({
  success: t.Boolean(),
  setting: t.Optional(systemSettingSchema),
  value: t.Optional(t.Any()),
  error: t.Optional(t.String())
})

export const updateSystemSettingResponseSchema = t.Object({
  success: t.Boolean(),
  setting: t.Optional(systemSettingSchema),
  message: t.Optional(t.String()),
  error: t.Optional(t.String())
})

export const getPublicSettingsResponseSchema = t.Object({
  success: t.Boolean(),
  settings: t.Optional(t.Record(t.String(), t.Any())),
  error: t.Optional(t.String())
})

export const listUserPreferencesResponseSchema = t.Object({
  success: t.Boolean(),
  preferences: t.Optional(t.Array(userPreferenceSchema)),
  values: t.Optional(t.Record(t.String(), t.Any())),
  error: t.Optional(t.String())
})

export const updateUserPreferenceResponseSchema = t.Object({
  success: t.Boolean(),
  preference: t.Optional(userPreferenceSchema),
  message: t.Optional(t.String()),
  error: t.Optional(t.String())
})

/**
 * Setting validation schemas for specific settings
 */
export const passwordSettingsSchema = t.Object({
  'password.minLength': t.Integer({
    minimum: 4,
    maximum: 128,
    default: 8
  }),
  'password.requireUppercase': t.Boolean({
    default: true
  }),
  'password.requireLowercase': t.Boolean({
    default: true
  }),
  'password.requireNumber': t.Boolean({
    default: true
  }),
  'password.requireSpecial': t.Boolean({
    default: true
  })
})

export const loginSettingsSchema = t.Object({
  'login.lockoutAttempts': t.Integer({
    minimum: 1,
    maximum: 20,
    default: 5
  }),
  'login.lockoutDuration': t.Integer({
    minimum: 1,
    maximum: 1440, // 24 hours in minutes
    default: 15
  })
})

export const sessionSettingsSchema = t.Object({
  'session.maxAge': t.Integer({
    minimum: 1,
    maximum: 8760, // 1 year in hours
    default: 24
  }),
  'session.rememberMaxAge': t.Integer({
    minimum: 1,
    maximum: 365, // 1 year in days
    default: 30
  })
})

export const auditSettingsSchema = t.Object({
  'audit.retentionDays': t.Integer({
    minimum: 1,
    maximum: 365,
    default: 90
  }),
  'audit.enableExport': t.Boolean({
    default: true
  })
})

export const redisSettingsSchema = t.Object({
  'redis.scanCount': t.Integer({
    minimum: 10,
    maximum: 10000,
    default: 100
  }),
  'redis.maxKeyPageSize': t.Integer({
    minimum: 10,
    maximum: 10000,
    default: 1000
  }),
  'redis.connectionTimeout': t.Integer({
    minimum: 1000,
    maximum: 60000, // 60 seconds
    default: 5000
  })
})

export const appSettingsSchema = t.Object({
  'app.name': t.String({
    minLength: 1,
    maxLength: 100,
    default: 'RediStra'
  }),
  'app.allowSignup': t.Boolean({
    default: false
  }),
  'app.maintenanceMode': t.Boolean({
    default: false
  })
})

/**
 * User preference validation schemas
 */
export const uiPreferencesSchema = t.Object({
  'theme': t.Union([
    t.Literal('light'),
    t.Literal('dark'),
    t.Literal('auto')
  ], {
    default: 'auto'
  }),
  'language': t.String({
    minLength: 2,
    maxLength: 10,
    default: 'en'
  }),
  'defaultPageSize': t.Integer({
    minimum: 10,
    maximum: 1000,
    default: 25
  })
})

export const redisPreferencesSchema = t.Object({
  'defaultDatabase': t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  }),
  'keyValueDisplay': t.Union([
    t.Literal('raw'),
    t.Literal('formatted'),
    t.Literal('hex')
  ], {
    default: 'formatted'
  }),
  'autoRefresh': t.Boolean({
    default: false
  }),
  'autoRefreshInterval': t.Integer({
    minimum: 5,
    maximum: 300,
    default: 10
  })
})

export const editorPreferencesSchema = t.Object({
  'editorTheme': t.Union([
    t.Literal('vs-dark'),
    t.Literal('vs-light')
  ], {
    default: 'vs-dark'
  }),
  'editorFontSize': t.Integer({
    minimum: 10,
    maximum: 24,
    default: 14
  }),
  'editorTabSize': t.Integer({
    minimum: 2,
    maximum: 8,
    default: 2
  })
})
