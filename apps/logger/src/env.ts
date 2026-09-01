import { useEnv } from '@malcesine/env'
import { z } from 'zod'

export const env = useEnv({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOGGER_PORT: z.coerce.number().int().positive().default(4201),
  LOGGER_FLUSH_INTERVAL_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 60 * 1_000),
  LOGGER_DATA_DIR: z.string().default('./data/logs'),
  DATABASE_URL: z.string().min(1),
})
