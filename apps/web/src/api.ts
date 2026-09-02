import type { Reading, StationId, StationMeta, SummaryRow } from '@/types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status} su ${path}`)
  return res.json() as Promise<T>
}

export function getStations(): Promise<Record<StationId, StationMeta>> {
  return getJson('/stations')
}

export function getCurrent(): Promise<Record<StationId, Reading | null>> {
  return getJson('/current')
}

export function getHistory(opts: { station: StationId; minutes: number }): Promise<Reading[]> {
  return getJson(`/history?station=${opts.station}&minutes=${opts.minutes}`)
}

export function getHistorySummary(opts: {
  station: StationId
  bucket: number
  minutes: number
}): Promise<SummaryRow[]> {
  return getJson(
    `/history/summary?station=${opts.station}&bucket=${opts.bucket}&minutes=${opts.minutes}`,
  )
}
