import type { Station } from '@malcesine/db'

export interface ScrapedReading {
  station: Station
  recordedAt: Date
  windSpeedKmh: number | null
  windGustKmh: number | null
  windDirDeg: number | null
  windDirLabel: string | null
  temperatureC: number | null
  humidityPct: number | null
  pressureHpa: number | null
  raw: Record<string, unknown>
}
