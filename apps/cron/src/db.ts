import { useDatabase } from '@malcesine/db'
import postgres from 'postgres'
import { env } from '@/env'
import { logger } from '@/logger'

export * from '@malcesine/db'
export const database = useDatabase({ connectionString: env.DATABASE_URL, logger })
export const { db, pg, connect, heartbeat } = database

// Connessione dedicata: il lock advisory è legato alla sessione,
// non può condividere il pool generico di pg
export const lockConn = postgres(env.DATABASE_URL, { max: 1 })
