/**
 * Import/Export Validation Schemas
 */

import { t } from 'elysia'

/**
 * Export Keys Schema
 */
export const exportKeysSchema = t.Object({
  format: t.Union([
    t.Literal('json'),
    t.Literal('csv')
  ], {
    error: 'Format must be json or csv'
  }),
  database: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  })),
  pattern: t.Optional(t.String({
    minLength: 1,
    maxLength: 1000
  })),
  type: t.Optional(t.String({
    minLength: 1,
    maxLength: 50
  })),
  includeTTL: t.Optional(t.Boolean({
    default: true
  })),
  includeValues: t.Optional(t.Boolean({
    default: true
  })),
  limit: t.Optional(t.Integer({
    minimum: 1,
    maximum: 1000000
  }))
})

/**
 * Export Connection Schema
 */
export const exportConnectionSchema = t.Object({
  connectionId: t.String({
    error: 'Connection ID is required'
  }),
  format: t.Optional(t.Literal('json'))
})

/**
 * Export Database Schema
 */
export const exportDatabaseSchema = t.Object({
  connectionId: t.String({
    error: 'Connection ID is required'
  }),
  database: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15
  })),
  format: t.Union([
    t.Literal('rdb'),
    t.Literal('json')
  ], {
    error: 'Format must be rdb or json'
  }),
  includeAllDatabases: t.Optional(t.Boolean({
    default: false
  }))
})

/**
 * Import Keys Schema
 */
export const importKeysSchema = t.Object({
  connectionId: t.String({
    minLength: 1,
    error: 'Connection ID is required'
  }),
  format: t.Union([
    t.Literal('json'),
    t.Literal('csv')
  ], {
    error: 'Format must be json or csv'
  }),
  conflictResolution: t.Union([
    t.Literal('skip'),
    t.Literal('overwrite'),
    t.Literal('rename')
  ], {
    error: 'Conflict resolution must be skip, overwrite, or rename'
  }),
  database: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  })),
  validateTTL: t.Optional(t.Boolean({
    default: true
  })),
  dryRun: t.Optional(t.Boolean({
    default: false
  }))
})

/**
 * Import Connection Schema
 */
export const importConnectionSchema = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 100,
    error: 'Connection name is required'
  }),
  host: t.String({
    minLength: 1,
    maxLength: 255,
    error: 'Host is required'
  }),
  port: t.Integer({
    minimum: 1,
    maximum: 65535,
    error: 'Port must be between 1 and 65535'
  }),
  password: t.Optional(t.String({
    minLength: 0,
    maxLength: 1000
  })),
  database: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  })),
  useTls: t.Optional(t.Boolean({
    default: false
  })),
  testConnection: t.Optional(t.Boolean({
    default: true
  })),
  conflictResolution: t.Optional(t.Union([
    t.Literal('skip'),
    t.Literal('rename')
  ]))
})

/**
 * Import RDB Schema (Admin Only)
 */
export const importRDBSchema = t.Object({
  connectionId: t.String({
    error: 'Connection ID is required'
  }),
  database: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  })),
  overwriteExisting: t.Optional(t.Boolean({
    default: false
  }))
})

/**
 * Response schemas
 */
export const exportStatusResponseSchema = t.Object({
  success: t.Boolean(),
  exportId: t.Optional(t.String()),
  status: t.Optional(t.Union([
    t.Literal('pending'),
    t.Literal('processing'),
    t.Literal('completed'),
    t.Literal('failed')
  ])),
  progress: t.Optional(t.Integer({
    minimum: 0,
    maximum: 100
  })),
  downloadUrl: t.Optional(t.String()),
  fileSize: t.Optional(t.Integer()),
  recordCount: t.Optional(t.Integer()),
  error: t.Optional(t.String())
})

export const exportKeysResponseSchema = t.Object({
  success: t.Boolean(),
  exportId: t.Optional(t.String()),
  message: t.Optional(t.String()),
  error: t.Optional(t.String())
})

export const exportConnectionResponseSchema = t.Object({
  success: t.Boolean(),
  exportId: t.Optional(t.String()),
  message: t.Optional(t.String()),
  error: t.Optional(t.String())
})

export const exportDatabaseResponseSchema = t.Object({
  success: t.Boolean(),
  exportId: t.Optional(t.String()),
  message: t.Optional(t.String()),
  error: t.Optional(t.String())
})

export const importKeysResponseSchema = t.Object({
  success: t.Boolean(),
  imported: t.Optional(t.Integer()),
  skipped: t.Optional(t.Integer()),
  errors: t.Optional(t.Integer()),
  conflicts: t.Optional(t.Integer()),
  preview: t.Optional(t.Array(t.Object({
    key: t.String(),
    type: t.String(),
    value: t.Any(),
    action: t.Union([
      t.Literal('create'),
      t.Literal('skip'),
      t.Literal('overwrite'),
      t.Literal('rename')
    ])
  }))),
  error: t.Optional(t.String())
})

export const importConnectionResponseSchema = t.Object({
  success: t.Boolean(),
  connectionId: t.Optional(t.String()),
  message: t.Optional(t.String()),
  error: t.Optional(t.String())
})

export const importRDBResponseSchema = t.Object({
  success: t.Boolean(),
  keysImported: t.Optional(t.Integer()),
  databasesAffected: t.Optional(t.Integer()),
  message: t.Optional(t.String()),
  error: t.Optional(t.String())
})

/**
 * Export ID parameter schema
 */
export const exportIdSchema = t.Object({
  id: t.String({
    error: 'Export ID is required'
  })
})
