import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { STATIONS } from '@malcesine/db'
import { cache } from '@/cache'
import { env } from '@/env'
import { logger } from '@/logger'

function yesterdayDate(): string {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// Scode la finestra di 24h accumulata in Redis per ciascuna centralina e la scrive
// in un file NDJSON per giorno — archivio per elaborazioni future, non usato dalle
// route live (quelle restano su Postgres).
export async function archiveDailyReadings(): Promise<void> {
  const date = yesterdayDate()
  for (const station of STATIONS) {
    try {
      const rows = await cache.getWindowReadings(station)
      if (rows.length === 0) continue
      const dir = join(env.READINGS_ARCHIVE_DIR, station)
      await mkdir(dir, { recursive: true })
      const lines = `${rows.map((r) => JSON.stringify(r)).join('\n')}\n`
      await appendFile(join(dir, `${date}.jsonl`), lines, 'utf8')
      logger.info('letture archiviate', { station, date, count: rows.length })
    } catch (err: any) {
      logger.error('errore archiviazione letture', { station, error: err.message })
    }
  }
}
