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
