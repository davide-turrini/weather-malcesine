import { useEnv } from '@malcesine/env'
import { z } from 'zod'

export const env = useEnv({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4001),
  DATABASE_URL: z.string().min(1),
  LOGGER_URL: z.string().url().optional(),
})
