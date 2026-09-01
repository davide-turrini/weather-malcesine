import { randomUUID } from 'node:crypto'
import { readings } from '@malcesine/db'
import cron from 'node-cron'
import { connect, db, lockConn } from '@/db'
import { env } from '@/env'
import { logger } from '@/logger'
import { scrapeAddictedSport } from '@/scrapers/addictedSport'
import { scrapeHolfuy } from '@/scrapers/holfuy'
import type { ScrapedReading } from '@/scrapers/types'

export function buildApp() {
  async function acquireLock(): Promise<boolean> {
    const [row] = await lockConn<[{ acquired: boolean }]>`
      SELECT pg_try_advisory_lock(42::bigint) AS acquired
    `
    return row.acquired
  }

  async function storeReading(reading: ScrapedReading | null): Promise<void> {
    if (!reading) return
    await db.insert(readings).values({ id: randomUUID(), ...reading })
  }

  async function runHolfuy(): Promise<void> {
    try {
      const reading = await scrapeHolfuy(env.HOLFUY_STATION_ID)
      await storeReading(reading)
      logger.info('holfuy aggiornato', { speed: reading?.windSpeedKmh ?? null })
    } catch (err: any) {
      logger.error('errore scraping holfuy', { error: err.message })
    }
  }

  async function runAddictedSport(): Promise<void> {
    if (!env.ADDICTED_SPORT_URL) return
    try {
      const reading = await scrapeAddictedSport(env.ADDICTED_SPORT_URL)
      await storeReading(reading)
      if (reading) logger.info('addicted sport aggiornato', { speed: reading.windSpeedKmh })
    } catch (err: any) {
      logger.error('errore scraping addicted sport', { error: err.message })
    }
  }

  async function start(): Promise<void> {
    await connect()
    const acquired = await acquireLock()
    if (!acquired) {
      logger.warn("un'altra istanza è già in esecuzione — uscita")
      process.exit(0)
    }
    logger.info('lock acquisito')

    if (!cron.validate(env.SCRAPE_SCHEDULE)) {
      throw new Error(`SCRAPE_SCHEDULE non valido: ${env.SCRAPE_SCHEDULE}`)
    }
    cron.schedule(env.SCRAPE_SCHEDULE, runHolfuy)
    cron.schedule(env.SCRAPE_SCHEDULE, runAddictedSport)
    logger.info('scraper schedulati', { schedule: env.SCRAPE_SCHEDULE })

    // prima esecuzione immediata, senza aspettare il primo tick
    await runHolfuy()
    await runAddictedSport()
  }

  function stop(): void {}

  return { start, stop }
}
