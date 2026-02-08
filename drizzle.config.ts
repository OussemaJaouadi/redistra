import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: `file:${process.env.DATABASE_URL || './data/redis-ui.db'}`,
  },
} satisfies Config
