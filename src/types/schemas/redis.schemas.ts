/**
 * Redis Operations Validation Schemas
 */

import { t } from 'elysia'

/**
 * Redis data type enum
 */
const redisDataType = t.Union([
  t.Literal('string'),
  t.Literal('hash'),
  t.Literal('list'),
  t.Literal('set'),
  t.Literal('zset'),
  t.Literal('stream')
])

/**
 * List Keys Query Schema
 */
export const listKeysSchema = t.Object({
  pattern: t.Optional(t.String({
    minLength: 1,
    maxLength: 100,
    error: 'Invalid Redis pattern'
  })),
  type: t.Optional(t.Array(redisDataType)),
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  })),
  cursor: t.Optional(t.String()),
  count: t.Optional(t.Integer({
    minimum: 1,
    maximum: 1000,
    default: 100
  })),
  page: t.Optional(t.Integer({
    minimum: 1,
    default: 1
  })),
  limit: t.Optional(t.Integer({
    minimum: 1,
    maximum: 1000,
    default: 25
  }))
})

/**
 * Get Key Query Schema
 */
export const getKeySchema = t.Object({
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  }))
})

/**
 * Create Key Request Schema
 */
export const createKeySchema = t.Object({
  key: t.String({
    minLength: 1,
    maxLength: 512,
    error: 'Key name is required and must be 1-512 characters'
  }),
  type: redisDataType,
  value: t.Any(), // Will be validated based on type
  ttl: t.Optional(t.Integer({
    minimum: -1, // -1 for no expiry
    maximum: 2147483647, // Max 32-bit signed int
    error: 'TTL must be -1 (no expiry) or a positive number of seconds'
  })),
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  }))
})

/**
 * Update Key Request Schema
 */
export const updateKeySchema = t.Object({
  value: t.Any(), // Will be validated based on key type
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  }))
})

/**
 * Delete Key Request Schema
 */
export const deleteKeySchema = t.Object({
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  }))
})

/**
 * Set TTL Request Schema
 */
export const setTtlSchema = t.Object({
  ttl: t.Optional(t.Integer({
    minimum: -1, // -1 to remove TTL
    maximum: 2147483647,
    error: 'TTL must be -1 (remove) or a positive number of seconds'
  })),
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  }))
})

/**
 * Rename Key Request Schema
 */
export const renameKeySchema = t.Object({
  newKey: t.String({
    minLength: 1,
    maxLength: 512,
    error: 'New key name is required and must be 1-512 characters'
  }),
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  })),
  nx: t.Optional(t.Boolean({
    default: false
  }))
})

/**
 * Bulk Delete Request Schema
 */
export const bulkDeleteSchema = t.Object({
  keys: t.Array(t.String({
    minLength: 1,
    maxLength: 512
  }), {
    minItems: 1,
    maxItems: 1000,
    error: 'Must provide 1-1000 keys to delete'
  }),
  db: t.Optional(t.Integer({
    minimum: 0,
    maximum: 15,
    default: 0
  }))
})

/**
 * Hash Field Operation Schema
 */
export const hashFieldSchema = t.Object({
  field: t.String({
    minLength: 1,
    maxLength: 512,
    error: 'Field name is required'
  }),
  value: t.Optional(t.String()),
  operation: t.Union([
    t.Literal('get'),
    t.Literal('set'),
    t.Literal('delete')
  ])
})

/**
 * List Operation Schema
 */
export const listOperationSchema = t.Object({
  operation: t.Union([
    t.Literal('lpush'),
    t.Literal('rpush'),
    t.Literal('lpop'),
    t.Literal('rpop'),
    t.Literal('lset'),
    t.Literal('lindex')
  ]),
  index: t.Optional(t.Integer({
    minimum: 0
  })),
  value: t.Optional(t.String()),
  count: t.Optional(t.Integer({
    minimum: 1,
    maximum: 100
  }))
})

/**
 * Set Operation Schema
 */
export const setOperationSchema = t.Object({
  operation: t.Union([
    t.Literal('sadd'),
    t.Literal('srem'),
    t.Literal('smembers'),
    t.Literal('scard')
  ]),
  members: t.Optional(t.Array(t.String(), {
    maxItems: 1000
  }))
})

/**
 * Sorted Set Operation Schema
 */
export const zsetOperationSchema = t.Object({
  operation: t.Union([
    t.Literal('zadd'),
    t.Literal('zrem'),
    t.Literal('zrange'),
    t.Literal('zcard')
  ]),
  members: t.Optional(t.Array(t.Object({
    member: t.String(),
    score: t.Optional(t.Number())
  }), {
    maxItems: 1000
  })),
  start: t.Optional(t.Integer()),
  stop: t.Optional(t.Integer()),
  withScores: t.Optional(t.Boolean({
    default: false
  }))
})

/**
 * Stream Operation Schema
 */
export const streamOperationSchema = t.Object({
  operation: t.Union([
    t.Literal('xadd'),
    t.Literal('xdel'),
    t.Literal('xrange'),
    t.Literal('xlen')
  ]),
  id: t.Optional(t.String()),
  fields: t.Optional(t.Record(t.String(), t.String())),
  start: t.Optional(t.String()),
  end: t.Optional(t.String()),
  count: t.Optional(t.Integer({
    minimum: 1,
    maximum: 1000
  }))
})

/**
 * Response schemas for validation
 */
export const redisKeySchema = t.Object({
  key: t.String(),
  type: redisDataType,
  ttl: t.Optional(t.Integer()),
  size: t.Optional(t.Integer()),
  length: t.Optional(t.Integer()
)})

export const listKeysResponseSchema = t.Object({
  success: t.Boolean(),
  keys: t.Optional(t.Array(redisKeySchema)),
  total: t.Optional(t.Integer()),
  cursor: t.Optional(t.String()),
  hasMore: t.Optional(t.Boolean()),
  error: t.Optional(t.String())
})

export const getKeyResponseSchema = t.Object({
  success: t.Boolean(),
  key: t.Optional(redisKeySchema),
  value: t.Optional(t.Any()),
  error: t.Optional(t.String())
})

/**
 * Database operation schemas
 */
export const selectDatabaseSchema = t.Object({
  database: t.Integer({
    minimum: 0,
    maximum: 15,
    error: 'Database number must be between 0 and 15'
  })
})

export const flushDatabaseSchema = t.Object({
  confirmation: t.String({
    minLength: 1,
    maxLength: 2,
    error: 'Confirmation must match the database number'
  })
})

export const flushAllSchema = t.Object({
  confirmation: t.Literal('FLUSH_ALL', {
    error: 'Confirmation must be exactly "FLUSH_ALL"'
  }),
  doubleConfirmation: t.Literal('I_UNDERSTAND', {
    error: 'Double confirmation must be exactly "I_UNDERSTAND"'
  })
})

/**
 * Response schemas for database operations
 */
export const databaseInfoSchema = t.Object({
  number: t.Integer(),
  keyCount: t.Integer(),
  memoryUsage: t.Optional(t.Integer()),
  avgTtl: t.Optional(t.Integer()),
  expires: t.Optional(t.Integer()),
  persistent: t.Optional(t.Integer()),
  keyDistribution: t.Optional(t.Record(
    t.Union([
      t.Literal('string'),
      t.Literal('hash'),
      t.Literal('list'),
      t.Literal('set'),
      t.Literal('zset'),
      t.Literal('stream')
    ]),
    t.Integer()
  ))
})

export const listDatabasesResponseSchema = t.Object({
  success: t.Boolean(),
  databases: t.Optional(t.Array(databaseInfoSchema)),
  totalKeys: t.Optional(t.Integer()),
  totalMemory: t.Optional(t.Integer()),
  error: t.Optional(t.String())
})

export const getDatabaseInfoResponseSchema = t.Object({
  success: t.Boolean(),
  database: t.Optional(databaseInfoSchema),
  error: t.Optional(t.String())
})

export const selectDatabaseResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.Optional(t.String()),
  currentDatabase: t.Optional(t.Integer()),
  error: t.Optional(t.String())
})

export const flushDatabaseResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.Optional(t.String()),
  keysDeleted: t.Optional(t.Integer()),
  error: t.Optional(t.String())
})

export const flushAllResponseSchema = t.Object({
  success: t.Boolean(),
  message: t.Optional(t.String()),
  totalKeysDeleted: t.Optional(t.Integer()),
  databasesAffected: t.Optional(t.Integer()),
  error: t.Optional(t.String())
})
