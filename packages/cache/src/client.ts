import Redis from 'ioredis'
import type { CachedReading, UseCacheOpts } from '@/types'

const DEFAULT_WINDOW_MS = 24 * 60 * 60 * 1000

function keyFor(station: string): string {
  return `readings:${station}`
}

export function useCache(opts: UseCacheOpts) {
  const client = new Redis(opts.url, { lazyConnect: false })
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS

  async function pushReading(station: string, reading: CachedReading): Promise<void> {
    const ts = new Date(reading.recordedAt).getTime()
    const key = keyFor(station)
    await client.zadd(key, ts, JSON.stringify(reading))
    // finestra scorrevole: butta via tutto cio che e' piu vecchio della finestra
    await client.zremrangebyscore(key, '-inf', ts - windowMs)
  }

  async function getWindowReadings(station: string, sinceMs?: number): Promise<CachedReading[]> {
    const key = keyFor(station)
    const since = sinceMs ?? Date.now() - windowMs
    const raw = await client.zrangebyscore(key, since, '+inf')
    return raw.map((r) => JSON.parse(r) as CachedReading)
  }

  async function disconnect(): Promise<void> {
    await client.quit()
  }

  return { pushReading, getWindowReadings, disconnect, client }
}
