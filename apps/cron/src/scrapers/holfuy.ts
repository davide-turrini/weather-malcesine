import type { ScrapedReading } from './types'

// Holfuy pubblica sulla pagina pubblica (holfuy.com/en/data/<id>) solo segnaposto statici:
// i valori live vengono iniettati via JS da questo stesso endpoint JSON (vedi /js/rtr.js).
// Lo interroghiamo direttamente: è la fonte reale dei dati mostrati sulla pagina.
const ENDPOINT = 'https://holfuy.com/puget/mjso.php'

interface HolfuyResponse {
  valid: 'ok' | 'low_batt' | 'no_conn' | 'no_act'
  speed?: number
  gust?: number
  dir?: number
  dir_str?: string
  temperature?: number
  humidity?: number
  pressure?: number
}

export async function scrapeHolfuy(stationId: string): Promise<ScrapedReading | null> {
  const res = await fetch(`${ENDPOINT}?k=${encodeURIComponent(stationId)}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; malcesine-meteo/1.0)' },
  })
  if (!res.ok) throw new Error(`Holfuy HTTP ${res.status}`)

  const data = (await res.json()) as HolfuyResponse
  if (data.valid !== 'ok') return null // stazione offline / batteria scarica / non attiva

  return {
    station: 'holfuy',
    recordedAt: new Date(),
    windSpeedKmh: data.speed ?? null,
    windGustKmh: data.gust ?? null,
    windDirDeg: data.dir ?? null,
    windDirLabel: data.dir_str ?? null,
    temperatureC: data.temperature ?? null,
    humidityPct: data.humidity ?? null,
    pressureHpa: data.pressure ?? null,
    raw: data as unknown as Record<string, unknown>,
  }
}
