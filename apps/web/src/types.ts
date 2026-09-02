export type StationId = 'holfuy' | 'addicted_sport'

export interface Reading {
  id: string
  station: string
  recordedAt: string
  windSpeedKmh: number | null
  windGustKmh: number | null
  windDirDeg: number | null
  windDirLabel: string | null
  temperatureC: number | null
  humidityPct: number | null
  pressureHpa: number | null
}

export interface SummaryRow {
  station: string
  bucketStart: string
  avgWindSpeedKmh: number | null
  maxWindSpeedKmh: number | null
  maxGustKmh: number | null
  avgTemperatureC: number | null
  windDirLabel: string | null
  windDirDeg: number | null
  samples: number
}

export interface DirectionSector {
  optimalStart: number
  optimalEnd: number
  marginalStart: number
  marginalEnd: number
}

export interface StationMeta {
  role: string
  name: string
  altitudeM: number | null
  directionSector: DirectionSector | null
}
