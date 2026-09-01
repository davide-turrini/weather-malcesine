import { useDatabase } from '@malcesine/db'
import { env } from '@/env'
import { logger } from '@/logger'

export * from '@malcesine/db'
export const database = useDatabase({ connectionString: env.DATABASE_URL, logger })
export const { db, pg, connect, heartbeat, getAliveServices } = database
