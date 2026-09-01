import { gte, lt } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/schema'
import type { DB, Sql } from '@/types'

type LoggerLike = {
  info(msg: string, meta?: Record<string, unknown>): void
  warn(msg: string, meta?: Record<string, unknown>): void
  error(msg: string, meta?: Record<string, unknown>): void
}

export function useDatabase({
  connectionString,
  logger = console,
}: {
  connectionString: string
  logger?: LoggerLike
}) {
  const pg = postgres(connectionString) as Sql
  const db = drizzle(pg, { schema }) as DB

  async function connect(opts: { retries?: number; intervalMs?: number } = {}): Promise<void> {
    const { retries = 10, intervalMs = 2000 } = opts
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await pg`SELECT 1`
        if (attempt > 1) logger.info('[db] connesso', { attempt })
        else logger.info('[db] connesso')
        return
      } catch (err: any) {
        if (attempt === retries) {
          logger.error('[db] connessione fallita', { attempt, retries, error: err.message })
          throw new Error(`DB non raggiungibile dopo ${retries} tentativi: ${err.message}`)
        }
        logger.warn('[db] tentativo fallito, riprovo', { attempt, retries, intervalMs })
        await new Promise((resolve) => setTimeout(resolve, intervalMs))
      }
    }
  }

  async function heartbeat(
    service: string,
    instanceId: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    const now = new Date()
    await db
      .insert(schema.serviceHeartbeats)
      .values({ service, instanceId, updatedAt: now, meta })
      .onConflictDoUpdate({
        target: [schema.serviceHeartbeats.service, schema.serviceHeartbeats.instanceId],
        set: { updatedAt: now, meta },
      })
    // lazy cleanup: rimuove righe di processi morti (TTL 60 s)
    await db
      .delete(schema.serviceHeartbeats)
      .where(lt(schema.serviceHeartbeats.updatedAt, new Date(now.getTime() - 60_000)))
  }

  async function getAliveServices(ttlMs = 15_000) {
    const since = new Date(Date.now() - ttlMs)
    return db
      .select()
      .from(schema.serviceHeartbeats)
      .where(gte(schema.serviceHeartbeats.updatedAt, since))
  }

  return { db, pg, connect, heartbeat, getAliveServices }
}
