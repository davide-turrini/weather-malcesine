import { useEnv } from '@malcesine/env'
import { z } from 'zod'

export const env = useEnv({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1),
  SCRAPE_SCHEDULE: z.string().default('* * * * *'),
  HOLFUY_STATION_ID: z.string().default('1000'), // 1000 = Decollo Malcesine
  ADDICTED_SPORT_URL: z
    .string()
    .url()
    .default('https://it.addicted-sports.com/webcam/gardasee/malcesine/'),
  LOGGER_URL: z.string().url().optional(),
})
