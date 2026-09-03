export interface CachedReading {
  station: string
  recordedAt: string // ISO — serializzato per Redis, non un Date
  windSpeedKmh: number | null
  windGustKmh: number | null
  windDirDeg: number | null
  windDirLabel: string | null
  temperatureC: number | null
  humidityPct: number | null
  pressureHpa: number | null
  raw?: Record<string, unknown>
}

export interface UseCacheOpts {
  url: string
  windowMs?: number // ampiezza della finestra scorrevole, default 24h
}
