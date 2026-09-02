export const WIND_YELLOW_KMH = 15
export const WIND_RED_KMH = 25

export type WindLevel = 'normal' | 'yellow' | 'red'

export function windLevel(
  speedKmh: number | null | undefined,
  gustKmh: number | null | undefined,
): WindLevel {
  const worst = Math.max(speedKmh ?? 0, gustKmh ?? 0)
  if (worst > WIND_RED_KMH) return 'red'
  if (worst >= WIND_YELLOW_KMH) return 'yellow'
  return 'normal'
}

// Livello di UN singolo valore (non il "peggiore tra media e raffica" di windLevel) —
// usato per colorare le celle di una tabella dove media e raffica sono colonne separate.
export function valueTier(v: number | null | undefined): WindLevel {
  const val = v ?? 0
  if (val > WIND_RED_KMH) return 'red'
  if (val >= WIND_YELLOW_KMH) return 'yellow'
  return 'normal'
}

export function isInMarginalSector(
  sector: { marginalStart: number; marginalEnd: number },
  deg: number,
): boolean {
  const { marginalStart: s, marginalEnd: e } = sector
  return s > e ? deg > s || deg < e : deg > s && deg < e
}
