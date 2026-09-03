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
  REDIS_URL: z.string().default('redis://localhost:6379'),
  ARCHIVE_SCHEDULE: z.string().default('5 0 * * *'), // ogni giorno alle 00:05
  READINGS_ARCHIVE_DIR: z.string().default('./data/readings'),
})
